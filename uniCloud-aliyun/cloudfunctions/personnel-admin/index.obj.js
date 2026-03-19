const XLSX = require('xlsx')
const db = uniCloud.database()
const personnelCollection = db.collection('mbti-personnel')
const heartMessageCollection = db.collection('mbti-heart-message')
const attachmentCollection = db.collection('mbti-personnel-attachment')
const userCollection = db.collection('uni-id-users')
const COUNTER_COLLECTION = 'mbti-personnel-counter'
const COUNTER_DOC_ID = 'mbti-personnel'
const REVIEW_STATUS = ['pending', 'approved', 'rejected']
const DEFAULT_PAGE_SIZE = 5
const MAX_PAGE_SIZE = 50
const PERSONNEL_CACHE_TTL_MS = 15 * 1000
const HEART_MESSAGE_CACHE_TTL_MS = 10 * 1000
const PERSONAL_PHOTO_ATTACHMENT_TYPE = 'personal_photo'
const ADMIN_ROLE = {
	NORMAL: 0,
	COLLABORATOR: 1,
	ADMIN: 2,
	SUPER_ADMIN: 3
}
const HEART_MESSAGE_STATUS = ['draft', 'queued', 'delivered', 'revoked']
const runtimeCache = {
	personnel: {
		data: null,
		expireAt: 0
	},
	heartMessages: {
		data: null,
		expireAt: 0
	}
}
const HEADER_FIELD_MAP = {
	'唯一编号': 'person_id',
	'编号': 'person_id',
	'序号': 'row_no',
	'昵称': 'nickname',
	'姓名': 'name',
	'性别': 'gender',
	'年龄': 'age',
	'个人照片': 'personal_photo',
	'照片': 'personal_photo',
	'手机号': 'mobile',
	'手机号码': 'mobile',
	'身份证号': 'id_card',
	'身份证号码': 'id_card',
	mbti: 'mbti',
	'籍贯': 'native_place',
	'职业': 'profession',
	'住址': 'address',
	'家庭大致情况': 'family_overview',
	'家庭情况': 'family_overview',
	'所在教会': 'church',
	'推荐人': 'referrer',
	'自我介绍': 'self_introduction',
	'感情情况': 'relationship_status',
	'活动出行方式': 'travel_mode',
	'出行方式': 'travel_mode',
	'当前审核状态': 'review_status',
	'审核状态': 'review_status',
	'审核人': 'reviewer',
	remark: 'remark',
	'说明': 'remark',
	'备注': 'remark',
	'remark说明': 'remark',
	'提交时间': 'submitted_at',
	'修改时间': 'updated_at'
}

function trimString(value) {
	return typeof value === 'string' ? value.trim() : ''
}

function normalizeHeader(value) {
	return trimString(String(value || ''))
		.replace(/\r/g, '')
		.replace(/\n/g, '')
		.replace(/\s+/g, '')
		.toLowerCase()
}

function normalizeReviewStatus(value) {
	const normalized = trimString(String(value || '')).toLowerCase()
	if (!normalized) {
		return 'pending'
	}
	if (normalized === 'pending' || normalized === '待审核') {
		return 'pending'
	}
	if (normalized === 'approved' || normalized === '閫氳繃' || normalized === '宸查€氳繃') {
		return 'approved'
	}
	if (normalized === 'rejected' || normalized === '驳回' || normalized === '已驳回') {
		return 'rejected'
	}
	return 'pending'
}

function generateRandomPasscode() {
	return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

function normalizePasscode(value, { autoGenerate = false } = {}) {
	const normalized = trimString(String(value || ''))
	if (!normalized) {
		return autoGenerate ? generateRandomPasscode() : ''
	}
	if (!/^\d{4}$/.test(normalized)) {
			throw new Error('操作失败')
	}
	return normalized
}

function normalizeTimestamp(value, fallback) {
	if (!value) {
		return fallback
	}
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return fallback
	}
	return date
}

function normalizeAdminRole(value, fallback = ADMIN_ROLE.NORMAL) {
	if (value === '' || value === null || typeof value === 'undefined') {
		return fallback
	}
	const numericValue = Number(value)
	if (
		!Number.isInteger(numericValue) ||
		numericValue < ADMIN_ROLE.NORMAL ||
		numericValue > ADMIN_ROLE.SUPER_ADMIN
	) {
		return fallback
	}
	return numericValue
}

function isDeletedRecord(value) {
	const normalized = String(value).trim().toLowerCase()
	return value === true || value === 1 || normalized === '1' || normalized === 'true'
}

function createBusinessError(message, code = 'BUSINESS_ERROR') {
	return {
		ok: false,
		code,
		message
	}
}

function normalizePositiveInt(value, fallback) {
	const parsed = parseInt(value, 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeNonNegativeInt(value, fallback = 0) {
	const parsed = parseInt(value, 10)
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function getRemainingHeartValue(record = {}, fallback = 3) {
	const legacyFallback = normalizeNonNegativeInt(record.heart_message_quota, fallback)
	return normalizeNonNegativeInt(record.remaining_heart_value, legacyFallback)
}

function normalizePayload(payload = {}, options = {}) {
	const now = new Date()
	const ageValue = Number(payload.age)
	const reviewStatus = normalizeReviewStatus(payload.review_status)
	const adminRole = normalizeAdminRole(payload.admin_role, ADMIN_ROLE.NORMAL)
	const passcode = normalizePasscode(payload.passcode, options)
	const remainingHeartValue = getRemainingHeartValue(payload, 3)
	const record = {
		user_id: trimString(payload.user_id),
		wx_openid: trimString(payload.wx_openid),
		wx_unionid: trimString(payload.wx_unionid),
		wx_nickname: trimString(payload.wx_nickname),
		wx_avatar: trimString(payload.wx_avatar),
		wx_gender: normalizePositiveInt(payload.wx_gender, 0),
		wx_language: trimString(payload.wx_language),
		wx_city: trimString(payload.wx_city),
		wx_province: trimString(payload.wx_province),
		wx_country: trimString(payload.wx_country),
		nickname: trimString(payload.nickname),
		name: trimString(payload.name),
		gender: trimString(payload.gender),
		age: Number.isFinite(ageValue) && ageValue > 0 ? Math.floor(ageValue) : null,
		personal_photo: trimString(payload.personal_photo),
		mobile: trimString(payload.mobile),
		passcode,
		id_card: trimString(payload.id_card),
		mbti: trimString(payload.mbti).toUpperCase(),
		native_place: trimString(payload.native_place),
		profession: trimString(payload.profession),
		address: trimString(payload.address),
		family_overview: trimString(payload.family_overview),
		church: trimString(payload.church),
		referrer: trimString(payload.referrer),
		self_introduction: trimString(payload.self_introduction),
		relationship_status: trimString(payload.relationship_status),
		travel_mode: trimString(payload.travel_mode),
		review_status: reviewStatus,
		reviewer: trimString(payload.reviewer),
		remark: trimString(payload.remark),
		admin_role: adminRole,
		private_message_quota: normalizeNonNegativeInt(payload.private_message_quota, 0),
		heart_message_quota: normalizeNonNegativeInt(payload.heart_message_quota, remainingHeartValue),
		remaining_heart_value: remainingHeartValue,
		submitted_at: normalizeTimestamp(payload.submitted_at, now),
		updated_at: now
	}

	if (!record.nickname) {
		throw new Error('鏄电О涓嶈兘涓虹┖')
	}
	if (!record.name) {
		throw new Error('濮撳悕涓嶈兘涓虹┖')
	}
	if (record.mobile && !/^1\d{10}$/.test(record.mobile)) {
		throw new Error('鎵嬫満鍙锋牸寮忎笉姝ｇ‘')
	}
	if (record.id_card && !/(^\d{15}$)|(^\d{17}[\dXx]$)/.test(record.id_card)) {
			throw new Error('操作失败')
	}
	if (record.mbti && !/^(E|I)(N|S)(T|F)(J|P)$/.test(record.mbti)) {
			throw new Error('操作失败')
	}
	if (record.passcode && !/^\d{4}$/.test(record.passcode)) {
			throw new Error('操作失败')
	}

	return record
}

function withFormattedDates(record = {}) {
	return {
		...record,
		submitted_at_text: record.submitted_at ? new Date(record.submitted_at).toISOString() : '',
		updated_at_text: record.updated_at ? new Date(record.updated_at).toISOString() : ''
	}
}

function withFormattedHeartMessage(record = {}) {
	return {
		...record,
		type: normalizeHeartMessageType(record.type, 1),
		created_at_text: record.created_at ? new Date(record.created_at).toISOString() : '',
		updated_at_text: record.updated_at ? new Date(record.updated_at).toISOString() : '',
		delivered_at_text: record.delivered_at ? new Date(record.delivered_at).toISOString() : ''
	}
}

function buildStats(list = []) {
	return {
		total: list.length,
		pending: list.filter((item) => item.review_status === 'pending').length,
		approved: list.filter((item) => item.review_status === 'approved').length,
		rejected: list.filter((item) => item.review_status === 'rejected').length,
		admins: list.filter(
			(item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.ADMIN
		).length,
		superAdmins: list.filter(
			(item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.SUPER_ADMIN
		).length
	}
}

function isAdminRecord(record = {}) {
	const adminRole = normalizeAdminRole(record.admin_role, ADMIN_ROLE.NORMAL)
	return adminRole === ADMIN_ROLE.ADMIN || adminRole === ADMIN_ROLE.SUPER_ADMIN
}

function matchesKeyword(record = {}, normalizedKeyword = '') {
	if (!normalizedKeyword) {
		return true
	}
	return [
		record.person_id,
		record.nickname,
		record.name,
		record.mobile,
		record.id_card,
		record.mbti,
		record.native_place,
		record.profession
	].some((field) =>
		String(field || '')
			.toLowerCase()
			.includes(normalizedKeyword)
	)
}

async function findActiveRecordByName(name) {
	const normalizedName = trimString(name)
	if (!normalizedName) {
		return null
	}
	const { data: list = [] } = await personnelCollection
		.where({
			name: normalizedName,
			is_deleted: false
		})
		.limit(1)
		.get()
	return list[0] || null
}

async function findActiveRecordByWxOpenid(wxOpenid) {
	const normalizedWxOpenid = trimString(wxOpenid)
	if (!normalizedWxOpenid) {
		return null
	}
	const { data: list = [] } = await personnelCollection
		.where({
			wx_openid: normalizedWxOpenid
		})
		.limit(20)
		.get()
	return list.find((item) => !isDeletedRecord(item && item.is_deleted)) || null
}

function getCandidateOpenIdsFromWxOpenid(wxOpenid) {
	if (!wxOpenid) {
		return []
	}
	if (typeof wxOpenid === 'string') {
		const value = wxOpenid.trim()
		return value ? [value] : []
	}
	if (typeof wxOpenid !== 'object') {
		return []
	}

	const preferredKeys = ['mp-weixin', 'mp_weixin', 'mp', 'weixin']
	const values = preferredKeys
		.map((key) => wxOpenid[key])
		.concat(Object.values(wxOpenid || {}))
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter(Boolean)

	return Array.from(new Set(values))
}

async function getWorkbookBuffer(fileID) {
	if (!trimString(fileID)) {
		throw new Error('缂哄皯瀵煎叆鏂囦欢')
	}
	const tempRes = await uniCloud.getTempFileURL({
		fileList: [fileID]
	})
	const fileInfo = tempRes.fileList && tempRes.fileList[0]
	if (!fileInfo || !fileInfo.tempFileURL) {
		throw new Error('鏈幏鍙栧埌瀵煎叆鏂囦欢鍦板潃')
	}
	const response = await uniCloud.httpclient.request(fileInfo.tempFileURL, {
		method: 'GET',
		responseType: 'arraybuffer'
	})
	if (!response || response.status !== 200 || !response.data) {
		throw new Error('瀵煎叆鏂囦欢涓嬭浇澶辫触')
	}
	return response.data
}

function mapRowToPayload(headerMap, row = []) {
	const payload = {}
	for (let i = 0; i < headerMap.length; i++) {
		const field = headerMap[i]
		if (!field || field === 'row_no' || field === 'person_id') {
			continue
		}
		payload[field] = row[i]
	}
	return payload
}

function isEmptyPayload(payload) {
	return !Object.keys(payload).some((key) => trimString(String(payload[key] || '')))
}

async function getFileTempUrl(fileID) {
	if (!trimString(fileID)) {
		return ''
	}
	try {
		const tempRes = await uniCloud.getTempFileURL({
			fileList: [fileID]
		})
		const fileInfo = tempRes.fileList && tempRes.fileList[0]
		return (fileInfo && fileInfo.tempFileURL) || ''
	} catch (error) {
		return ''
	}
}

async function syncPersonalPhotoAttachment({ personnelRecordId, personId, fileID }) {
	const normalizedPersonnelRecordId = trimString(personnelRecordId)
	if (!normalizedPersonnelRecordId) {
		return
	}

	const where = {
		personnel_record_id: normalizedPersonnelRecordId,
		attachment_type: PERSONAL_PHOTO_ATTACHMENT_TYPE
	}
	const { data: currentList = [] } = await attachmentCollection.where(where).limit(1).get()
	const current = currentList[0]

	if (!trimString(fileID)) {
		if (current && current._id) {
			await attachmentCollection.doc(current._id).update({
				status: 'deleted',
				file_id: '',
				file_url: '',
				updated_at: new Date()
			})
		}
		return
	}

	const tempFileUrl = await getFileTempUrl(fileID)
	const payload = {
		personnel_record_id: normalizedPersonnelRecordId,
		person_id: normalizePositiveInt(personId, 0),
		attachment_type: PERSONAL_PHOTO_ATTACHMENT_TYPE,
		file_id: trimString(fileID),
		file_url: tempFileUrl,
		storage_provider: 'uniCloud',
		status: 'active',
		updated_at: new Date()
	}

	if (current && current._id) {
		await attachmentCollection.doc(current._id).update(payload)
		return
	}

	await attachmentCollection.add({
		...payload,
		created_at: new Date()
	})
}

async function fetchAllPersonnelRecords() {
	const batchSize = 500
	let skip = 0
	let list = []

	while (true) {
		const { data = [] } = await personnelCollection
			.orderBy('person_id', 'asc')
			.skip(skip)
			.limit(batchSize)
			.get()
		list = list.concat(data)
		if (data.length < batchSize) {
			break
		}
		skip += data.length
	}

	return list
}

async function fetchAllHeartMessages() {
	const batchSize = 500
	let skip = 0
	let list = []

	while (true) {
		const { data = [] } = await heartMessageCollection
			.orderBy('created_at', 'desc')
			.skip(skip)
			.limit(batchSize)
			.get()
		list = list.concat(data)
		if (data.length < batchSize) {
			break
		}
		skip += data.length
	}

	return list
}

function invalidateRuntimeCache({ personnel = false, heartMessages = false } = {}) {
	if (personnel) {
		runtimeCache.personnel.data = null
		runtimeCache.personnel.expireAt = 0
	}
	if (heartMessages) {
		runtimeCache.heartMessages.data = null
		runtimeCache.heartMessages.expireAt = 0
	}
}

async function getCachedPersonnelRecords({ forceRefresh = false } = {}) {
	const now = Date.now()
	if (
		!forceRefresh &&
		Array.isArray(runtimeCache.personnel.data) &&
		now < runtimeCache.personnel.expireAt
	) {
		return runtimeCache.personnel.data
	}

	const list = await fetchAllPersonnelRecords()
	runtimeCache.personnel.data = list
	runtimeCache.personnel.expireAt = now + PERSONNEL_CACHE_TTL_MS
	return list
}

async function getCachedHeartMessages({ forceRefresh = false } = {}) {
	const now = Date.now()
	if (
		!forceRefresh &&
		Array.isArray(runtimeCache.heartMessages.data) &&
		now < runtimeCache.heartMessages.expireAt
	) {
		return runtimeCache.heartMessages.data
	}

	const list = await fetchAllHeartMessages()
	runtimeCache.heartMessages.data = list
	runtimeCache.heartMessages.expireAt = now + HEART_MESSAGE_CACHE_TTL_MS
	return list
}

function buildPersonnelLabel(record = {}) {
	const personId = Number(record.person_id || 0)
	const nickname = trimString(record.nickname)
	const name = trimString(record.name)
	const mbti = trimString(record.mbti).toUpperCase()
	const title = nickname || name || '未命名参与者'
	const suffix = name && nickname && name !== nickname ? ` / ${name}` : name && !nickname ? ` / ${name}` : ''
	const mbtiSuffix = mbti ? ` / ${mbti}` : ''
	return `#${personId || '-'} ${title}${suffix}${mbtiSuffix}`
}

function normalizeHeartMessageStatus(value, fallback = 'draft') {
	const normalized = trimString(String(value || '')).toLowerCase()
	return HEART_MESSAGE_STATUS.includes(normalized) ? normalized : fallback
}

function normalizeHeartMessageType(value, fallback = 1) {
	const numericValue = Number(value)
	return numericValue === 0 || numericValue === 1 ? numericValue : fallback
}

function buildHeartMessageStats(list = []) {
	return {
		total: list.length,
		draft: list.filter((item) => item.status === 'draft').length,
		queued: list.filter((item) => item.status === 'queued').length,
		delivered: list.filter((item) => item.status === 'delivered').length,
		revoked: list.filter((item) => item.status === 'revoked').length
	}
}

function matchesHeartMessageKeyword(record = {}, normalizedKeyword = '') {
	if (!normalizedKeyword) {
		return true
	}

	return [
		record.sender_person_id,
		record.receiver_person_id,
		record.sender_name,
		record.sender_nickname,
		record.sender_mbti,
		record.receiver_name,
		record.receiver_nickname,
		record.receiver_mbti,
		record.content,
		record.admin_remark
	].some((field) =>
		String(field || '')
			.toLowerCase()
			.includes(normalizedKeyword)
	)
}

function normalizeGenderValue(value = '') {
	const normalized = trimString(String(value || '')).toLowerCase()
	if (!normalized) {
		return ''
	}
	if (['男', 'male', 'man', 'm', '1'].includes(normalized)) {
		return 'male'
	}
	if (['女', 'female', 'woman', 'f', '2'].includes(normalized)) {
		return 'female'
	}
	return ''
}

function isOppositeGender(selfGender, targetGender) {
	const normalizedSelf = normalizeGenderValue(selfGender)
	const normalizedTarget = normalizeGenderValue(targetGender)
	if (!normalizedSelf || !normalizedTarget) {
		return true
	}
	return normalizedSelf !== normalizedTarget
}

function getMessageTimestamp(record = {}) {
	const date = new Date(record.created_at || record.created_at_text || 0)
	const time = date.getTime()
	return Number.isNaN(time) ? 0 : time
}

function getLatestMessageBetween(list = [], leftId = '', rightId = '') {
	const normalizedLeftId = trimString(leftId)
	const normalizedRightId = trimString(rightId)
	if (!normalizedLeftId || !normalizedRightId) {
		return null
	}

	let latest = null
	for (let i = 0; i < list.length; i++) {
		const item = list[i]
		const senderId = trimString(item && item.sender_record_id)
		const receiverId = trimString(item && item.receiver_record_id)
		const isPair =
			(senderId === normalizedLeftId && receiverId === normalizedRightId) ||
			(senderId === normalizedRightId && receiverId === normalizedLeftId)
		if (!isPair) {
			continue
		}
		if (!latest || getMessageTimestamp(item) > getMessageTimestamp(latest)) {
			latest = item
		}
	}
	return latest
}

async function getPersonnelById(id) {
	if (!trimString(id)) {
		return null
	}
	const { data = [] } = await personnelCollection.doc(id).get()
	const record = data[0]
	if (!record || isDeletedRecord(record.is_deleted)) {
		return null
	}
	return record
}

async function ensureHeartMessagePersonnel(senderId, receiverId) {
	const sender = await getPersonnelById(senderId)
	if (!sender) {
		throw new Error('鍙戦€佹柟鍙備笌鑰呬笉瀛樺湪')
	}
	const receiver = await getPersonnelById(receiverId)
	if (!receiver) {
		throw new Error('鎺ユ敹鏂瑰弬涓庤€呬笉瀛樺湪')
	}
	if (sender._id === receiver._id) {
			throw new Error('操作失败')
	}
	return {
		sender,
		receiver
	}
}

function buildHeartMessagePayload({ sender, receiver, payload = {}, currentRecord = null } = {}) {
	const now = new Date()
	const content = trimString(payload.content)
	if (!content) {
		throw new Error('绉佷俊鍐呭涓嶈兘涓虹┖')
	}
	if (content.length > 300) {
		throw new Error('绉佷俊鍐呭鏈€澶?300 涓瓧')
	}

	const status = normalizeHeartMessageStatus(payload.status, currentRecord ? currentRecord.status : 'draft')
	const type = normalizeHeartMessageType(payload.type, currentRecord ? currentRecord.type : 1)
	const quotaCost = normalizeNonNegativeInt(
		payload.quota_cost,
		currentRecord ? currentRecord.quota_cost : 1
	)
	if (type === 1 && quotaCost < 1) {
		throw new Error('鎵ｅ噺娆℃暟鑷冲皯涓?1')
	}

	let deliveredAt = currentRecord ? currentRecord.delivered_at || null : null
	if (status === 'delivered') {
		deliveredAt = deliveredAt || now
	}
	if (status !== 'delivered') {
		deliveredAt = null
	}

	return {
		sender_record_id: sender._id,
		sender_person_id: Number(sender.person_id || 0),
		sender_name: trimString(sender.name),
		sender_nickname: trimString(sender.nickname),
		sender_mbti: trimString(sender.mbti).toUpperCase(),
		receiver_record_id: receiver._id,
		receiver_person_id: Number(receiver.person_id || 0),
		receiver_name: trimString(receiver.name),
		receiver_nickname: trimString(receiver.nickname),
		receiver_mbti: trimString(receiver.mbti).toUpperCase(),
		content,
		type,
		is_anonymous: payload.is_anonymous === false ? false : true,
		quota_cost: quotaCost,
		status,
		admin_remark: trimString(payload.admin_remark),
		delivered_at: deliveredAt,
		updated_at: now
	}
}

async function updatePersonnelRecord({ id, data } = {}) {
	if (!trimString(id)) {
		throw new Error('缂哄皯璁板綍ID')
	}
	const { data: currentList = [] } = await personnelCollection.doc(id).get()
	const current = currentList[0]
	if (!current || isDeletedRecord(current.is_deleted)) {
		throw new Error('璁板綍涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
	}

	const payload = normalizePayload({
		...current,
		...data,
		submitted_at: current.submitted_at
	})

	await personnelCollection.doc(id).update({
		...payload,
		person_id: current.person_id
	})
	await syncPersonalPhotoAttachment({
		personnelRecordId: id,
		personId: current.person_id,
		fileID: payload.personal_photo
	})
	invalidateRuntimeCache({
		personnel: true
	})

	return {
		id,
		person_id: current.person_id,
		passcode: payload.passcode,
		admin_role: payload.admin_role
	}
}

module.exports = {
	async list({ keyword = '', reviewStatus = 'all', page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
		const currentPage = normalizePositiveInt(page, 1)
		const currentPageSize = Math.min(
			normalizePositiveInt(pageSize, DEFAULT_PAGE_SIZE),
			MAX_PAGE_SIZE
		)
		const data = await getCachedPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		let list = data
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedDates)

		if (normalizedKeyword) {
			list = list.filter((item) => matchesKeyword(item, normalizedKeyword))
		}

		if (reviewStatus && reviewStatus !== 'all') {
			list = list.filter((item) => item.review_status === reviewStatus)
		}

		const total = list.length
		const start = (currentPage - 1) * currentPageSize
		const pageList = list.slice(start, start + currentPageSize)

		return {
			list: pageList,
			total,
			page: currentPage,
			pageSize: currentPageSize,
			stats: buildStats(list)
		}
	},

	async searchNames({ keyword = '', limit = 5 } = {}) {
		const normalizedKeyword = trimString(keyword).toLowerCase()
		const maxLimit = Math.min(Math.max(Number(limit) || 5, 1), 5)
		const records = await getCachedPersonnelRecords()
		const names = []

		for (let i = 0; i < records.length; i++) {
			const item = records[i]
			const name = trimString(item && item.name)
			if (!name || isDeletedRecord(item && item.is_deleted)) {
				continue
			}
			if (normalizedKeyword && name.toLowerCase().indexOf(normalizedKeyword) === -1) {
				continue
			}
			if (names.some((entry) => entry.name === name)) {
				continue
			}
			names.push({
				_id: item._id,
				name,
				admin_role: normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL)
			})
			if (names.length >= maxLimit) {
				break
			}
		}

		return {
			list: names
		}
	},

	async getByWxOpenid({ wxOpenid = '' } = {}) {
		const record = await findActiveRecordByWxOpenid(wxOpenid)
		if (!record) {
			return {
				ok: true,
				record: null
			}
		}

		return {
			ok: true,
			record: withFormattedDates(record)
		}
	},

	async getCurrentLoginWxOpenid({ uid = '' } = {}) {
		const normalizedUid = trimString(uid)
		if (!normalizedUid) {
			return {
				ok: true,
				uid: '',
				openIds: [],
				wxOpenid: {}
			}
		}

		const { data: userList = [] } = await userCollection.doc(normalizedUid).get()
		const userRecord = userList[0] || {}
		const wxOpenid = userRecord.wx_openid || {}
		const openIds = getCandidateOpenIdsFromWxOpenid(wxOpenid)

		return {
			ok: true,
			uid: normalizedUid,
			openIds,
			wxOpenid,
			wxUnionid: trimString(userRecord.wx_unionid)
		}
	},

	async listAdmins({ keyword = '' } = {}) {
		const data = await getCachedPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		const list = data
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedDates)
			.filter((item) => isAdminRecord(item))
			.filter((item) => matchesKeyword(item, normalizedKeyword))
			.sort((left, right) => {
				const leftRole = normalizeAdminRole(left.admin_role, ADMIN_ROLE.NORMAL)
				const rightRole = normalizeAdminRole(right.admin_role, ADMIN_ROLE.NORMAL)
				if (leftRole !== rightRole) {
					return rightRole - leftRole
				}
				return Number(left.person_id || 0) - Number(right.person_id || 0)
			})

		return {
			list,
			stats: {
				total: list.length,
				admins: list.filter(
					(item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.ADMIN
				).length,
				superAdmins: list.filter(
					(item) =>
						normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.SUPER_ADMIN
				).length
			}
		}
	},

	async listAdminCandidates({ keyword = '' } = {}) {
		const data = await getCachedPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		const list = data
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedDates)
			.filter((item) => {
				const role = normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL)
				return role !== ADMIN_ROLE.ADMIN && role !== ADMIN_ROLE.SUPER_ADMIN
			})
			.filter((item) => matchesKeyword(item, normalizedKeyword))
			.sort((left, right) => Number(left.person_id || 0) - Number(right.person_id || 0))

		return {
			list
		}
	},

	async listPrivateMessageCandidates({
		keyword = '',
		page = 1,
		pageSize = DEFAULT_PAGE_SIZE
	} = {}) {
		const currentPage = normalizePositiveInt(page, 1)
		const currentPageSize = Math.min(
			normalizePositiveInt(pageSize, DEFAULT_PAGE_SIZE),
			MAX_PAGE_SIZE
		)
		const data = await getCachedPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		const list = data
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedDates)
			.filter((item) => item.review_status === 'approved')
			.filter((item) => matchesKeyword(item, normalizedKeyword))
			.sort((left, right) => Number(left.person_id || 0) - Number(right.person_id || 0))
			.map((item) => ({
				_id: item._id,
				person_id: item.person_id,
				nickname: item.nickname || '',
				name: item.name || '',
				mbti: item.mbti || '',
				mobile: item.mobile || '',
				review_status: item.review_status || 'pending',
				private_message_quota: normalizeNonNegativeInt(item.private_message_quota, 0),
				heart_message_quota: normalizeNonNegativeInt(item.heart_message_quota, 0),
				remaining_heart_value: getRemainingHeartValue(item, 3),
				label: buildPersonnelLabel(item)
			}))
		const total = list.length
		const start = (currentPage - 1) * currentPageSize
		const pageList = list.slice(start, start + currentPageSize)

		return {
			list: pageList,
			total,
			page: currentPage,
			pageSize: currentPageSize
		}
	},

	async listHeartMessages({
		keyword = '',
		status = 'all',
		page = 1,
		pageSize = DEFAULT_PAGE_SIZE
	} = {}) {
		const currentPage = normalizePositiveInt(page, 1)
		const currentPageSize = Math.min(
			normalizePositiveInt(pageSize, DEFAULT_PAGE_SIZE),
			MAX_PAGE_SIZE
		)
		const normalizedKeyword = trimString(keyword).toLowerCase()
		let list = (await getCachedHeartMessages())
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedHeartMessage)

		if (status && status !== 'all') {
			list = list.filter((item) => item.status === status)
		}

		if (normalizedKeyword) {
			list = list.filter((item) => matchesHeartMessageKeyword(item, normalizedKeyword))
		}

		const total = list.length
		const start = (currentPage - 1) * currentPageSize
		const pageList = list.slice(start, start + currentPageSize)

		return {
			list: pageList,
			total,
			page: currentPage,
			pageSize: currentPageSize,
			stats: buildHeartMessageStats(list)
		}
	},

	async getUserHeartMessageHome({ personnelId = '', keyword = '' } = {}) {
		const self = await getPersonnelById(personnelId)
		if (!self) {
			throw new Error('褰撳墠鐢ㄦ埛璧勬枡涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}

		const normalizedKeyword = trimString(keyword).toLowerCase()
		const personnelList = await getCachedPersonnelRecords()
		const allMessages = (await getCachedHeartMessages())
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedHeartMessage)
		const messageMap = {}

		allMessages.forEach((item) => {
			const senderId = trimString(item.sender_record_id)
			const receiverId = trimString(item.receiver_record_id)
			let contactId = ''
			if (senderId === self._id) {
				contactId = receiverId
			} else if (receiverId === self._id) {
				contactId = senderId
			}
			if (!contactId) {
				return
			}
			if (!messageMap[contactId] || new Date(item.created_at).getTime() > new Date(messageMap[contactId].created_at).getTime()) {
				messageMap[contactId] = item
			}
		})

		const contacts = personnelList
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.filter((item) => item._id !== self._id)
			.filter((item) => item.review_status === 'approved')
			.filter((item) => isOppositeGender(self.gender, item.gender))
			.map((item) => {
				const latestMessage = messageMap[item._id] || null
				const canSend = !latestMessage || trimString(latestMessage.sender_record_id) !== self._id
				return {
					_id: item._id,
					person_id: item.person_id,
					nickname: item.nickname || '',
					name: item.name || '',
					gender: item.gender || '',
					mbti: item.mbti || '',
					personal_photo: item.personal_photo || '',
					label: buildPersonnelLabel(item),
					latest_message: latestMessage ? latestMessage.content || '' : '',
					latest_message_type: latestMessage ? normalizeHeartMessageType(latestMessage.type, 1) : -1,
					latest_message_at:
						latestMessage && (latestMessage.created_at_text || latestMessage.created_at)
							? latestMessage.created_at_text || latestMessage.created_at
							: '',
					latest_message_status: latestMessage ? latestMessage.status || 'delivered' : '',
					can_send: canSend,
					can_send_reason: canSend ? '' : '请等待对方回复后再发送下一条',
					heart_message_quota: normalizeNonNegativeInt(item.heart_message_quota, 0),
					remaining_heart_value: getRemainingHeartValue(item, 3)
				}
			})
			.filter((item) => matchesKeyword(item, normalizedKeyword))
			.sort((left, right) => {
				const rightTime = right.latest_message_at ? new Date(right.latest_message_at).getTime() : 0
				const leftTime = left.latest_message_at ? new Date(left.latest_message_at).getTime() : 0
				if (rightTime !== leftTime) {
					return rightTime - leftTime
				}
				return Number(left.person_id || 0) - Number(right.person_id || 0)
			})

		return {
			self: {
				_id: self._id,
				person_id: self.person_id,
				name: self.name || '',
				nickname: self.nickname || '',
				mbti: self.mbti || '',
				personal_photo: self.personal_photo || '',
				heart_message_quota: normalizeNonNegativeInt(self.heart_message_quota, 0),
				remaining_heart_value: getRemainingHeartValue(self, 3)
			},
			contacts
		}
	},

	async listUserHeartMessages({ personnelId = '', contactId = '', since = '' } = {}) {
		const self = await getPersonnelById(personnelId)
		if (!self) {
			throw new Error('褰撳墠鐢ㄦ埛璧勬枡涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}
		const contact = await getPersonnelById(contactId)
		if (!contact) {
				throw new Error('操作失败')
		}

		const allList = (await getCachedHeartMessages())
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.filter((item) => {
				const senderId = trimString(item.sender_record_id)
				const receiverId = trimString(item.receiver_record_id)
				return (
					(senderId === self._id && receiverId === contact._id) ||
					(senderId === contact._id && receiverId === self._id)
				)
			})
			.map(withFormattedHeartMessage)
			.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
		const latestMessage = allList[allList.length - 1] || null
		const canSend = !latestMessage || trimString(latestMessage.sender_record_id) !== self._id
		let list = allList
		const sinceTime = getMessageTimestamp({ created_at: since })
		if (sinceTime > 0) {
			list = allList.filter((item) => getMessageTimestamp(item) > sinceTime)
		}

		return {
			self: {
				_id: self._id,
				person_id: self.person_id,
				name: self.name || '',
				nickname: self.nickname || '',
				mbti: self.mbti || '',
				personal_photo: self.personal_photo || '',
				heart_message_quota: normalizeNonNegativeInt(self.heart_message_quota, 0),
				remaining_heart_value: getRemainingHeartValue(self, 3)
			},
			contact: {
				_id: contact._id,
				person_id: contact.person_id,
				name: contact.name || '',
				nickname: contact.nickname || '',
				gender: contact.gender || '',
				mbti: contact.mbti || '',
				personal_photo: contact.personal_photo || ''
			},
			list,
			latest_created_at:
				latestMessage && (latestMessage.created_at_text || latestMessage.created_at)
					? latestMessage.created_at_text || latestMessage.created_at
					: '',
			can_send: canSend,
			can_send_reason: canSend ? '' : '请等待对方回复后再发送下一条'
		}
	},

	async listUserInboxLetters({ personnelId = '', keyword = '' } = {}) {
		const self = await getPersonnelById(personnelId)
		if (!self) {
			throw new Error('当前用户资料不存在或已被删除')
		}

		const normalizedKeyword = trimString(keyword).toLowerCase()
		const personnelList = await getCachedPersonnelRecords()
		const personnelMap = {}
		personnelList.forEach((item) => {
			if (!item || isDeletedRecord(item.is_deleted)) {
				return
			}
			personnelMap[item._id] = item
		})

		const allMessages = (await getCachedHeartMessages({ forceRefresh: true }))
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedHeartMessage)

		const receivedLatestMap = {}
		allMessages.forEach((item) => {
			const senderId = trimString(item.sender_record_id)
			const receiverId = trimString(item.receiver_record_id)
			if (receiverId !== self._id || !senderId) {
				return
			}
			if (
				!receivedLatestMap[senderId] ||
				getMessageTimestamp(item) > getMessageTimestamp(receivedLatestMap[senderId])
			) {
				receivedLatestMap[senderId] = item
			}
		})

		const list = Object.keys(receivedLatestMap)
			.map((senderId) => {
				const latestReceived = receivedLatestMap[senderId]
				const sender = personnelMap[senderId] || {}
				const latestPairMessage = getLatestMessageBetween(allMessages, self._id, senderId)
				const canReply =
					!!latestPairMessage && trimString(latestPairMessage.sender_record_id) !== self._id
				return {
					message_id: latestReceived._id,
					contact_id: senderId,
					sender_mbti: trimString(sender.mbti).toUpperCase() || latestReceived.sender_mbti || '',
					content: latestReceived.content || '',
					type: normalizeHeartMessageType(latestReceived.type, 0),
					created_at: latestReceived.created_at_text || latestReceived.created_at || '',
					can_reply: canReply,
					can_reply_reason: canReply ? '' : '浣犲凡鍥炲杩囪鏉ヤ俊锛岄渶绛夊緟瀵规柟鍐嶆鏉ヤ俊'
				}
			})
			.filter((item) => {
				if (!normalizedKeyword) {
					return true
				}
				return [item.sender_mbti, item.content].some((field) =>
					String(field || '')
						.toLowerCase()
						.includes(normalizedKeyword)
				)
			})
			.sort((left, right) => getMessageTimestamp(right) - getMessageTimestamp(left))

		return {
			self: {
				_id: self._id,
				person_id: self.person_id,
				name: self.name || '',
				nickname: self.nickname || '',
				mbti: self.mbti || '',
				personal_photo: self.personal_photo || '',
				heart_message_quota: normalizeNonNegativeInt(self.heart_message_quota, 0),
				remaining_heart_value: getRemainingHeartValue(self, 3)
			},
			list
		}
	},

	async updatePrivateMessageQuota({ id, quota, mode = 'set' } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯鍙備笌鑰呰褰旾D')
		}

		const { data = [] } = await personnelCollection.doc(id).get()
		const current = data[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('鍙備笌鑰呬笉瀛樺湪鎴栧凡鍒犻櫎')
		}

		const currentQuota = normalizeNonNegativeInt(current.private_message_quota, 0)
		const nextQuotaValue = normalizeNonNegativeInt(quota, -1)
		if (nextQuotaValue < 0) {
				throw new Error('操作失败')
		}

		let nextQuota = nextQuotaValue
		if (mode === 'increase') {
			nextQuota = currentQuota + nextQuotaValue
		}
		if (mode === 'decrease') {
			nextQuota = Math.max(0, currentQuota - nextQuotaValue)
		}

		await personnelCollection.doc(id).update({
			private_message_quota: nextQuota,
			updated_at: new Date()
		})
		invalidateRuntimeCache({
			personnel: true
		})

		return {
			id,
			person_id: current.person_id,
			private_message_quota: nextQuota
		}
	},

	async createHeartMessage({ data } = {}) {
		const senderId = trimString(data && data.sender_record_id)
		const receiverId = trimString(data && data.receiver_record_id)
		const { sender, receiver } = await ensureHeartMessagePersonnel(senderId, receiverId)
		const payload = buildHeartMessagePayload({
			sender,
			receiver,
			payload: data
		})
		const senderQuota = normalizeNonNegativeInt(sender.private_message_quota, 0)
		if (senderQuota < payload.quota_cost) {
			throw new Error('鍙戦€佹柟鍙敤绉佷俊娆℃暟涓嶈冻')
		}

		const transaction = await db.startTransaction()
		try {
			const transactionPersonnel = transaction.collection('mbti-personnel')
			const transactionHeartMessage = transaction.collection('mbti-heart-message')

			await transactionPersonnel.doc(sender._id).update({
				private_message_quota: senderQuota - payload.quota_cost,
				updated_at: new Date()
			})

			const createRes = await transactionHeartMessage.add({
				...payload,
				created_at: new Date(),
				is_deleted: false
			})

			await transaction.commit()
			invalidateRuntimeCache({
				personnel: true,
				heartMessages: true
			})

			return {
				id: createRes.id,
				sender_person_id: sender.person_id,
				receiver_person_id: receiver.person_id,
				remaining_quota: senderQuota - payload.quota_cost
			}
		} catch (error) {
			await transaction.rollback()
			throw error
		}
	},

	async sendUserHeartMessage({ personnelId = '', contactId = '', content = '', type = 0 } = {}) {
		const { sender, receiver } = await ensureHeartMessagePersonnel(personnelId, contactId)
		const latestPairMessage = getLatestMessageBetween(
			(await getCachedHeartMessages({ forceRefresh: true })).filter(
				(item) => !isDeletedRecord(item && item.is_deleted)
			),
			sender._id,
			receiver._id
		)
		if (latestPairMessage && trimString(latestPairMessage.sender_record_id) === sender._id) {
				throw new Error('操作失败')
		}

		const messageType = normalizeHeartMessageType(type, 0)
		const payload = buildHeartMessagePayload({
			sender,
			receiver,
			payload: {
				content,
				type: messageType,
				status: 'delivered',
				quota_cost: messageType === 1 ? 1 : 0,
				is_anonymous: false,
				admin_remark: ''
			}
		})

		const senderHeartQuota = getRemainingHeartValue(sender, 3)
		if (messageType === 1 && senderHeartQuota < 1) {
				throw new Error('操作失败')
		}

		if (messageType !== 1) {
			const createRes = await heartMessageCollection.add({
				...payload,
				created_at: new Date(),
				is_deleted: false
			})
			invalidateRuntimeCache({
				heartMessages: true
			})
			return {
				id: createRes.id,
				type: messageType,
				remaining_heart_value: senderHeartQuota,
				remaining_heart_message_quota: senderHeartQuota
			}
		}
		const transaction = await db.startTransaction()
		try {
			const transactionPersonnel = transaction.collection('mbti-personnel')
			const transactionHeartMessage = transaction.collection('mbti-heart-message')

			if (messageType === 1) {
				await transactionPersonnel.doc(sender._id).update({
					remaining_heart_value: senderHeartQuota - 1,
					heart_message_quota: senderHeartQuota - 1,
					updated_at: new Date()
				})
			}

			const createRes = await transactionHeartMessage.add({
				...payload,
				created_at: new Date(),
				is_deleted: false
			})

			await transaction.commit()
			invalidateRuntimeCache({
				personnel: true,
				heartMessages: true
			})

			return {
				id: createRes.id,
				type: messageType,
				remaining_heart_value: messageType === 1 ? senderHeartQuota - 1 : senderHeartQuota,
				remaining_heart_message_quota: messageType === 1 ? senderHeartQuota - 1 : senderHeartQuota
			}
		} catch (error) {
			await transaction.rollback()
			throw error
		}
	},

	async updateHeartMessage({ id, data } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯绉佷俊璁板綍ID')
		}
		const { data: heartMessageList = [] } = await heartMessageCollection.doc(id).get()
		const currentRecord = heartMessageList[0]
		if (!currentRecord || isDeletedRecord(currentRecord.is_deleted)) {
				throw new Error('操作失败')
		}

		const senderId = trimString((data && data.sender_record_id) || currentRecord.sender_record_id)
		const receiverId = trimString((data && data.receiver_record_id) || currentRecord.receiver_record_id)
		const { sender, receiver } = await ensureHeartMessagePersonnel(senderId, receiverId)
		const payload = buildHeartMessagePayload({
			sender,
			receiver,
			payload: {
				...currentRecord,
				...data
			},
			currentRecord
		})

		const previousSenderId = trimString(currentRecord.sender_record_id)
		const nextSenderId = trimString(payload.sender_record_id)
		const previousQuotaCost = normalizeNonNegativeInt(currentRecord.quota_cost, 1)
		const nextQuotaCost = normalizeNonNegativeInt(payload.quota_cost, 1)

		const transaction = await db.startTransaction()
		try {
			const transactionPersonnel = transaction.collection('mbti-personnel')
			const transactionHeartMessage = transaction.collection('mbti-heart-message')
			const senderQuota = normalizeNonNegativeInt(sender.private_message_quota, 0)

			if (previousSenderId === nextSenderId) {
				const quotaDiff = nextQuotaCost - previousQuotaCost
				if (quotaDiff > 0 && senderQuota < quotaDiff) {
						throw new Error('操作失败')
				}
				if (quotaDiff !== 0) {
					await transactionPersonnel.doc(sender._id).update({
						private_message_quota: Math.max(0, senderQuota - quotaDiff),
						updated_at: new Date()
					})
				}
			} else {
				const previousSender = await getPersonnelById(previousSenderId)
				if (!previousSender) {
					throw new Error('鍘熷彂閫佹柟鍙備笌鑰呬笉瀛樺湪')
				}
				if (senderQuota < nextQuotaCost) {
					throw new Error('鏂板彂閫佹柟鍙敤绉佷俊娆℃暟涓嶈冻')
				}
				const previousSenderQuota = normalizeNonNegativeInt(previousSender.private_message_quota, 0)
				await transactionPersonnel.doc(previousSender._id).update({
					private_message_quota: previousSenderQuota + previousQuotaCost,
					updated_at: new Date()
				})
				await transactionPersonnel.doc(sender._id).update({
					private_message_quota: senderQuota - nextQuotaCost,
					updated_at: new Date()
				})
			}

			await transactionHeartMessage.doc(id).update(payload)
			await transaction.commit()
			invalidateRuntimeCache({
				personnel: true,
				heartMessages: true
			})
		} catch (error) {
			await transaction.rollback()
			throw error
		}
		return {
			id,
			status: payload.status
		}
	},

	async removeHeartMessage({ id } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯绉佷俊璁板綍ID')
		}
		const { data = [] } = await heartMessageCollection.doc(id).get()
		const current = data[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
				throw new Error('操作失败')
		}

		await heartMessageCollection.doc(id).update({
			is_deleted: true,
			updated_at: new Date()
		})
		invalidateRuntimeCache({
			heartMessages: true
		})

		return {
			id
		}
	},

	async updateAdminRole({ id, adminRole } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯璁板綍ID')
		}
		const nextAdminRole = normalizeAdminRole(adminRole, -1)
		if (![ADMIN_ROLE.NORMAL, ADMIN_ROLE.ADMIN].includes(nextAdminRole)) {
			throw new Error('鍙敮鎸?0 鎴?1')
		}
		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('璁板綍涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}
		const currentAdminRole = normalizeAdminRole(current.admin_role, ADMIN_ROLE.NORMAL)
		if (currentAdminRole === ADMIN_ROLE.SUPER_ADMIN) {
				throw new Error('操作失败')
		}
		if (currentAdminRole === nextAdminRole) {
			return {
				id,
				person_id: current.person_id,
				admin_role: currentAdminRole
			}
		}

		await personnelCollection.doc(id).update({
			admin_role: nextAdminRole,
			updated_at: new Date()
		})
		invalidateRuntimeCache({
			personnel: true
		})

		return {
			id,
			person_id: current.person_id,
			admin_role: nextAdminRole
		}
	},

	async create({ data } = {}) {
		const record = normalizePayload(data, {
			autoGenerate: true
		})
		const transaction = await db.startTransaction()

		try {
			const counterCollection = transaction.collection(COUNTER_COLLECTION)
			const transactionPersonnel = transaction.collection('mbti-personnel')
			const counterRes = await counterCollection.doc(COUNTER_DOC_ID).get()
			const counterDoc = counterRes.data && counterRes.data[0]
			const nextId = counterDoc ? counterDoc.seq + 1 : 1

			if (counterDoc) {
				await counterCollection.doc(COUNTER_DOC_ID).update({
					seq: nextId,
					updated_at: new Date()
				})
			} else {
				await counterCollection.add({
					_id: COUNTER_DOC_ID,
					seq: nextId,
					updated_at: new Date()
				})
			}

			const createRes = await transactionPersonnel.add({
				...record,
				person_id: nextId,
				is_deleted: false
			})

			await transaction.commit()
			await syncPersonalPhotoAttachment({
				personnelRecordId: createRes.id,
				personId: nextId,
				fileID: record.personal_photo
			})
			invalidateRuntimeCache({
				personnel: true
			})

			return {
				id: createRes.id,
				person_id: nextId,
				passcode: record.passcode
			}
		} catch (error) {
			await transaction.rollback()
			throw error
		}
	},

	async update({ id, data } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯璁板綍ID')
		}
		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('璁板綍涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}

		const payload = normalizePayload({
			...current,
			...data,
			submitted_at: current.submitted_at
		})

		await personnelCollection.doc(id).update({
			...payload,
			person_id: current.person_id
		})
		await syncPersonalPhotoAttachment({
			personnelRecordId: id,
			personId: current.person_id,
			fileID: payload.personal_photo
		})
		invalidateRuntimeCache({
			personnel: true
		})

		return {
			id,
			person_id: current.person_id,
			passcode: payload.passcode
		}
	},

	/*
	async resetAllPasscodes() {
		const records = await fetchAllPersonnelRecords()
		const activeRecords = records.filter((item) => !isDeletedRecord(item && item.is_deleted))
		let updatedCount = 0

		for (let i = 0; i < activeRecords.length; i++) {
			await personnelCollection.doc(activeRecords[i]._id).update({
				passcode: generateRandomPasscode(),
				updated_at: new Date()
			})
			updatedCount += 1
		}

		return {
			updatedCount
		}
	},
	*/

	async softDelete({ id } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯璁板綍ID')
		}
		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('璁板綍涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}

		await personnelCollection.doc(id).update({
			is_deleted: true,
			updated_at: new Date()
		})
		invalidateRuntimeCache({
			personnel: true
		})

		return {
			id,
			person_id: current.person_id
		}
	},

	async importExcel({ fileID } = {}) {
		const buffer = await getWorkbookBuffer(fileID)
		const workbook = XLSX.read(buffer, {
			type: 'buffer'
		})
		const firstSheetName = workbook.SheetNames[0]
		if (!firstSheetName) {
			throw new Error('Excel 鏂囦欢涓病鏈夊彲璇诲彇鐨勫伐浣滆〃')
		}
		const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
			header: 1,
			raw: false,
			defval: ''
		})
		if (!rows || rows.length < 3) {
				throw new Error('操作失败')
		}

		const headerRow = rows[1]
		const headerMap = headerRow.map((header) => HEADER_FIELD_MAP[normalizeHeader(header)] || '')
		if (headerMap.indexOf('nickname') === -1 || headerMap.indexOf('name') === -1) {
				throw new Error('操作失败')
		}

		const dataRows = rows.slice(2)
		const transaction = await db.startTransaction()
		const errors = []
		let importedCount = 0

		try {
			const counterCollection = transaction.collection(COUNTER_COLLECTION)
			const transactionPersonnel = transaction.collection('mbti-personnel')
			const counterRes = await counterCollection.doc(COUNTER_DOC_ID).get()
			const counterDoc = counterRes.data && counterRes.data[0]
			let nextId = counterDoc ? counterDoc.seq : 0
			const docsToAdd = []

			for (let i = 0; i < dataRows.length; i++) {
				const excelRow = dataRows[i]
				const payload = mapRowToPayload(headerMap, excelRow)
				if (isEmptyPayload(payload)) {
					continue
				}
				try {
					const record = normalizePayload(payload, {
						autoGenerate: true
					})
					nextId += 1
					docsToAdd.push({
						...record,
						person_id: nextId,
						is_deleted: false
					})
				} catch (error) {
					errors.push({
						row: i + 3,
						message: error.message
					})
				}
			}

			if (!docsToAdd.length) {
				throw new Error(errors.length ? '没有可导入的数据，请检查表格内容' : '未识别到有效数据表')
			}

			for (let i = 0; i < docsToAdd.length; i++) {
				await transactionPersonnel.add(docsToAdd[i])
			}

			if (counterDoc) {
				await counterCollection.doc(COUNTER_DOC_ID).update({
					seq: nextId,
					updated_at: new Date()
				})
			} else {
				await counterCollection.add({
					_id: COUNTER_DOC_ID,
					seq: nextId,
					updated_at: new Date()
				})
			}

			await transaction.commit()
			importedCount = docsToAdd.length
			invalidateRuntimeCache({
				personnel: true
			})
		} catch (error) {
			await transaction.rollback()
			throw error
		}

		return {
			importedCount,
			skippedCount: errors.length,
			errors: errors.slice(0, 20)
		}
	},

	async upsertByUser({ userId, personnelId, data } = {}) {
		const normalizedPersonnelId = trimString(personnelId)
		const normalizedPasscode = trimString(data && data.passcode)
		if (!normalizedPersonnelId || !/^\d{4}$/.test(normalizedPasscode)) {
			return createBusinessError('鍙ｄ护閿欒锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'INVALID_PASSCODE')
		}
		const normalizedUserId = trimString(userId)
		if (!normalizedUserId) {
			throw new Error('缂哄皯鐢ㄦ埛ID')
		}

		const { data: currentList = [] } = await personnelCollection
			.where({
				user_id: normalizedUserId,
				is_deleted: false
			})
			.limit(1)
			.get()
		const current = currentList[0]

		if (current && current._id) {
			if (current.passcode !== normalizedPasscode) {
				return createBusinessError('鍙ｄ护閿欒锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'INVALID_PASSCODE')
			}
			return await updatePersonnelRecord({
				id: current._id,
				data: {
					...data,
					user_id: normalizedUserId,
					passcode: current.passcode
				}
			})
		}

		const { data: matchedList = [] } = await personnelCollection.doc(normalizedPersonnelId).get()
		const matchedRecord = matchedList[0]
		if (
			!matchedRecord ||
			isDeletedRecord(matchedRecord.is_deleted) ||
			matchedRecord.passcode !== normalizedPasscode
		) {
			return createBusinessError('鍙ｄ护閿欒锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'INVALID_PASSCODE')
		}
		if (matchedRecord.user_id && matchedRecord.user_id !== normalizedUserId) {
			return createBusinessError('璇ョ敤鎴峰凡缁戝畾鍏朵粬璐﹀彿锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'ACCOUNT_BOUND')
		}

		return await updatePersonnelRecord({
			id: matchedRecord._id,
			data: {
				...data,
				user_id: normalizedUserId,
				passcode: matchedRecord.passcode
			}
		})
	},

	async verifyAccess({ id, passcode, userId = '' } = {}) {
		const normalizedId = trimString(id)
		const normalizedPasscode = trimString(passcode)
		const normalizedUserId = trimString(userId)
		if (!normalizedId || !/^\d{4}$/.test(normalizedPasscode)) {
			return createBusinessError('鍙ｄ护閿欒锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'INVALID_PASSCODE')
		}

		const { data: matchedList = [] } = await personnelCollection.doc(normalizedId).get()
		const matchedRecord = matchedList[0]
		if (
			!matchedRecord ||
			isDeletedRecord(matchedRecord.is_deleted) ||
			matchedRecord.passcode !== normalizedPasscode
		) {
			return createBusinessError('鍙ｄ护閿欒锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'INVALID_PASSCODE')
		}
		if (matchedRecord.user_id && normalizedUserId && matchedRecord.user_id !== normalizedUserId) {
			return createBusinessError('璇ョ敤鎴峰凡缁戝畾鍏朵粬璐﹀彿锛屽鏈夌枒闂鑱旂郴鐩稿叧鍚屽伐', 'ACCOUNT_BOUND')
		}

		return {
			ok: true,
			id: matchedRecord._id,
			person_id: matchedRecord.person_id,
			name: matchedRecord.name
		}
	},

	async saveMbtiResult({ id, mbti } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯璁板綍ID')
		}

		const normalizedMbti = trimString(mbti).toUpperCase()
		if (!/^(E|I)(N|S)(T|F)(J|P)$/.test(normalizedMbti)) {
				throw new Error('操作失败')
		}

		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('璁板綍涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎')
		}

		await personnelCollection.doc(id).update({
			mbti: normalizedMbti,
			updated_at: new Date()
		})
		invalidateRuntimeCache({
			personnel: true
		})

		return {
			id,
			person_id: current.person_id,
			mbti: normalizedMbti
		}
	}
}


