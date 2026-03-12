const XLSX = require('xlsx')
const db = uniCloud.database()
const personnelCollection = db.collection('mbti-personnel')
const COUNTER_COLLECTION = 'mbti-personnel-counter'
const COUNTER_DOC_ID = 'mbti-personnel'
const REVIEW_STATUS = ['pending', 'approved', 'rejected']
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

function normalizePayload(payload = {}) {
	const now = new Date()
	const ageValue = Number(payload.age)
	const reviewStatus = normalizeReviewStatus(payload.review_status)
	const record = {
		nickname: trimString(payload.nickname),
		name: trimString(payload.name),
		gender: trimString(payload.gender),
		age: Number.isFinite(ageValue) && ageValue > 0 ? Math.floor(ageValue) : null,
		personal_photo: trimString(payload.personal_photo),
		mobile: trimString(payload.mobile),
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
		rejected: list.filter((item) => item.review_status === 'rejected').length
	}
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

module.exports = {
	async list({ keyword = '', reviewStatus = 'all' } = {}) {
		const { data = [] } = await personnelCollection.orderBy('updated_at', 'desc').limit(200).get()
		const normalizedKeyword = trimString(keyword).toLowerCase()
		let list = data.map(withFormattedDates)

		if (normalizedKeyword) {
			list = list.filter((item) => {
				return [
					item.person_id,
					item.nickname,
					item.name,
					item.mobile,
					item.id_card,
					item.mbti,
					item.native_place,
					item.profession
				].some((field) => String(field || '').toLowerCase().includes(normalizedKeyword))
			})
		}

		if (reviewStatus && reviewStatus !== 'all') {
			list = list.filter((item) => item.review_status === reviewStatus)
		}

		return {
			list,
			stats: buildStats(list)
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
				person_id: nextId
			})

			await transaction.commit()

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
		if (!current) {
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
						person_id: nextId
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
	}
}
