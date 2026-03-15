const XLSX = require('xlsx')
const db = uniCloud.database()
const personnelCollection = db.collection('mbti-personnel')
const attachmentCollection = db.collection('mbti-personnel-attachment')
const COUNTER_COLLECTION = 'mbti-personnel-counter'
const COUNTER_DOC_ID = 'mbti-personnel'
const REVIEW_STATUS = ['pending', 'approved', 'rejected']
const DEFAULT_PAGE_SIZE = 5
const MAX_PAGE_SIZE = 50
const PERSONAL_PHOTO_ATTACHMENT_TYPE = 'personal_photo'
const ADMIN_ROLE = {
	NORMAL: 0,
	ADMIN: 1,
	SUPER_ADMIN: 2
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
	'mbti': 'mbti',
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
	'remark': 'remark',
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
	if (normalized === 'approved' || normalized === '通过' || normalized === '已通过') {
		return 'approved'
	}
	if (normalized === 'rejected' || normalized === '驳回' || normalized === '已驳回') {
		return 'rejected'
	}
	return 'pending'
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
	if (!Number.isInteger(numericValue) || numericValue < ADMIN_ROLE.NORMAL || numericValue > ADMIN_ROLE.SUPER_ADMIN) {
		return fallback
	}
	return numericValue
}

function isDeletedRecord(value) {
	const normalized = String(value).trim().toLowerCase()
	return value === true || value === 1 || normalized === '1' || normalized === 'true'
}

function normalizePayload(payload = {}) {
	const now = new Date()
	const ageValue = Number(payload.age)
	const reviewStatus = normalizeReviewStatus(payload.review_status)
	const adminRole = normalizeAdminRole(payload.admin_role, ADMIN_ROLE.NORMAL)
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
		passcode: trimString(payload.passcode),
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
		submitted_at: normalizeTimestamp(payload.submitted_at, now),
		updated_at: now
	}

	if (!record.nickname) {
		throw new Error('昵称不能为空')
	}
	if (!record.name) {
		throw new Error('姓名不能为空')
	}
	if (record.mobile && !/^1\d{10}$/.test(record.mobile)) {
		throw new Error('手机号格式不正确')
	}
	if (record.id_card && !/(^\d{15}$)|(^\d{17}[\dXx]$)/.test(record.id_card)) {
		throw new Error('身份证号格式不正确')
	}
	if (record.mbti && !/^(E|I)(N|S)(T|F)(J|P)$/.test(record.mbti)) {
		throw new Error('MBTI 格式不正确')
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

function buildStats(list = []) {
	return {
		total: list.length,
		pending: list.filter((item) => item.review_status === 'pending').length,
		approved: list.filter((item) => item.review_status === 'approved').length,
		rejected: list.filter((item) => item.review_status === 'rejected').length,
		admins: list.filter((item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.ADMIN).length,
		superAdmins: list.filter((item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.SUPER_ADMIN).length
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
	].some((field) => String(field || '').toLowerCase().includes(normalizedKeyword))
}

async function getWorkbookBuffer(fileID) {
	if (!trimString(fileID)) {
		throw new Error('缺少导入文件')
	}
	const tempRes = await uniCloud.getTempFileURL({
		fileList: [fileID]
	})
	const fileInfo = tempRes.fileList && tempRes.fileList[0]
	if (!fileInfo || !fileInfo.tempFileURL) {
		throw new Error('未获取到导入文件地址')
	}
	const response = await uniCloud.httpclient.request(fileInfo.tempFileURL, {
		method: 'GET',
		responseType: 'arraybuffer'
	})
	if (!response || response.status !== 200 || !response.data) {
		throw new Error('导入文件下载失败')
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

function normalizePositiveInt(value, fallback) {
	const parsed = parseInt(value, 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
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
		const { data = [] } = await personnelCollection.orderBy('person_id', 'asc').skip(skip).limit(batchSize).get()
		list = list.concat(data)
		if (data.length < batchSize) {
			break
		}
		skip += data.length
	}

	return list
}

module.exports = {
	async list({ keyword = '', reviewStatus = 'all', page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
		const currentPage = normalizePositiveInt(page, 1)
		const currentPageSize = Math.min(normalizePositiveInt(pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
		const data = await fetchAllPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		let list = data.filter((item) => !isDeletedRecord(item && item.is_deleted)).map(withFormattedDates)

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

	async listAdmins({ keyword = '' } = {}) {
		const data = await fetchAllPersonnelRecords()
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
				admins: list.filter((item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.ADMIN).length,
				superAdmins: list.filter((item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.SUPER_ADMIN).length
			}
		}
	},

	async listAdminCandidates({ keyword = '' } = {}) {
		const data = await fetchAllPersonnelRecords()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		const list = data
			.filter((item) => !isDeletedRecord(item && item.is_deleted))
			.map(withFormattedDates)
			.filter((item) => normalizeAdminRole(item.admin_role, ADMIN_ROLE.NORMAL) === ADMIN_ROLE.NORMAL)
			.filter((item) => matchesKeyword(item, normalizedKeyword))
			.sort((left, right) => Number(left.person_id || 0) - Number(right.person_id || 0))

		return {
			list
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
			throw new Error('瓒呯骇绠＄悊鍛樻潈闄愪笉鍙慨鏀?')
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

		return {
			id,
			person_id: current.person_id,
			admin_role: nextAdminRole
		}
	},

	async create({ data } = {}) {
		const record = normalizePayload(data)
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

			return {
				id: createRes.id,
				person_id: nextId
			}
		} catch (error) {
			await transaction.rollback()
			throw error
		}
	},

	async update({ id, data } = {}) {
		if (!trimString(id)) {
			throw new Error('缺少记录ID')
		}
		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('记录不存在或已被删除')
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

		return {
			id,
			person_id: current.person_id
		}
	},

	async softDelete({ id } = {}) {
		if (!trimString(id)) {
			throw new Error('缺少记录ID')
		}
		const { data: currentList = [] } = await personnelCollection.doc(id).get()
		const current = currentList[0]
		if (!current || isDeletedRecord(current.is_deleted)) {
			throw new Error('记录不存在或已被删除')
		}

		await personnelCollection.doc(id).update({
			is_deleted: true,
			updated_at: new Date()
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
			throw new Error('Excel 文件中没有可读取的工作表')
		}
		const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
			header: 1,
			raw: false,
			defval: ''
		})
		if (!rows || rows.length < 3) {
			throw new Error('表格格式不正确，至少需要时间行、表头行和一行数据')
		}

		const headerRow = rows[1]
		const headerMap = headerRow.map((header) => HEADER_FIELD_MAP[normalizeHeader(header)] || '')
		if (headerMap.indexOf('nickname') === -1 || headerMap.indexOf('name') === -1) {
			throw new Error('表头缺少必要字段：昵称、姓名')
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
					const record = normalizePayload(payload)
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
				throw new Error(errors.length ? '没有可导入的数据，请检查表格内容' : '未识别到有效数据行')
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

	async upsertByUser({ userId, data } = {}) {
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
			return await this.update({
				id: current._id,
				data: {
					...data,
					user_id: normalizedUserId
				}
			})
		}

		return await this.create({
			data: {
				...data,
				user_id: normalizedUserId
			}
		})
	},

	async saveMbtiResult({ id, mbti } = {}) {
		if (!trimString(id)) {
			throw new Error('缂哄皯璁板綍ID')
		}

		const normalizedMbti = trimString(mbti).toUpperCase()
		if (!/^(E|I)(N|S)(T|F)(J|P)$/.test(normalizedMbti)) {
			throw new Error('MBTI 鏍煎紡涓嶆纭?')
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

		return {
			id,
			person_id: current.person_id,
			mbti: normalizedMbti
		}
	}
}
