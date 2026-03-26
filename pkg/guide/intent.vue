<template>
	<view class="page">
		<view class="toolbar">
			<button class="ghost-btn" @click="goBack">返回上一页</button>
			<button class="solid-btn" @click="loadRecordList">刷新数据</button>
		</view>

		<view v-if="accessChecked" class="panel-card hero-card">
			<view class="card-head">
				<text class="card-title">意向记录总览</text>
				<text class="card-tip">
					进入页面时会把提交记录一次性从云端拉回本地，之后的分页、互选匹配与合计分计算都在当前设备完成。
				</text>
			</view>

			<view class="stats-wrap">
				<view class="stat-card">
					<text class="stat-label">总记录数</text>
					<text class="stat-value">{{ summaryStats.totalRecords }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">当前展示</text>
					<text class="stat-value">{{ summaryStats.filteredRecords }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">意向条目</text>
					<text class="stat-value">{{ summaryStats.totalPicks }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">双向命中</text>
					<text class="stat-value">{{ summaryStats.mutualPicks }}</text>
				</view>
			</view>
		</view>

		<view v-if="accessChecked" class="panel-card filter-card">
			<view class="card-head">
				<text class="card-title">筛选条件</text>
				<text class="card-tip">支持按活动、编号、姓名、昵称、OpenID、MBTI 与意向对象关键词进行本地筛选。</text>
			</view>
			<input
				v-model.trim="keyword"
				class="search-input"
				placeholder="搜索活动ID / 提交人 / 对象 / OpenID / MBTI"
				confirm-type="search"
			/>
			<scroll-view class="status-scroll" scroll-x>
				<view class="status-row">
					<view
						v-for="item in statusOptions"
						:key="item.value"
						class="status-chip"
						:class="statusFilter === item.value ? 'status-chip active' : 'status-chip'"
						@click="changeStatus(item.value)"
					>
						{{ item.label }}
					</view>
				</view>
			</scroll-view>
		</view>

		<view v-if="accessChecked" class="panel-card">
			<view class="card-head">
				<text class="card-title">记录列表</text>
				<text class="card-tip">
					主表显示提交人关键信息；每条记录下方会展开意向明细，并展示本次分、对向分与合计分。
				</text>
			</view>

			<scroll-view scroll-x class="table-scroll">
				<view class="table">
					<view class="table-row table-header">
						<text class="col col-activity">活动</text>
						<text class="col col-person">提交人</text>
						<text class="col col-openid">提交人 OpenID</text>
						<text class="col col-status">状态</text>
						<text class="col col-count">已选</text>
						<text class="col col-score">原始总分</text>
						<text class="col col-score">关系合计</text>
						<text class="col col-count">互选数</text>
						<text class="col col-time">截止时间</text>
						<text class="col col-time">提交时间</text>
						<text class="col col-time">更新时间</text>
					</view>

					<view v-if="loading" class="empty-box">
						<text>正在加载提交记录...</text>
					</view>
					<view v-else-if="!recordList.length" class="empty-box">
						<text>当前没有可展示的提交记录</text>
					</view>
					<view v-else-if="!filteredRecordList.length" class="empty-box">
						<text>当前筛选条件下没有匹配结果</text>
					</view>

					<block
						v-for="item in pagedRecordList"
						:key="item._id || item.creator_record_id || `${item.activity_id}-${item.creator_wx_openid}`"
					>
						<view class="table-row body-row">
							<text class="col col-activity">{{ item.activity_id || '-' }}</text>
							<view class="col col-person person-cell">
								<text class="primary-text">#{{ item.creator_person_id || '-' }} · {{ item.creator_name || '-' }}</text>
								<text class="secondary-text">{{ item.creator_nickname || '未填写昵称' }}</text>
							</view>
							<text class="col col-openid openid-text">{{ item.creator_wx_openid || '-' }}</text>
							<view class="col col-status">
								<text class="status-pill" :class="statusClass(item.submit_status)">
									{{ statusText(item.submit_status) }}
								</text>
							</view>
							<text class="col col-count">{{ item.pick_count }}</text>
							<text class="col col-score">{{ item.total_score }}</text>
							<text class="col col-score score-strong">{{ item.linked_score_total }}</text>
							<text class="col col-count">{{ item.mutual_pick_count }}</text>
							<text class="col col-time">{{ formatDate(item.deadline_at) }}</text>
							<text class="col col-time">{{ formatDate(item.submitted_at) }}</text>
							<text class="col col-time">{{ formatDate(item.updated_at) }}</text>
						</view>

						<view class="detail-panel">
							<view class="detail-head">
								<text class="detail-title">意向明细</text>
								<text class="detail-summary">
									{{ item.pickViews.length }} 条 · 双向 {{ item.mutual_pick_count }} 条 · 合计 {{ item.linked_score_total }} 分
								</text>
							</view>
							<view v-if="item.pickViews.length" class="pick-list">
								<view v-for="pick in item.pickViews" :key="pick.key" class="pick-card">
									<view class="pick-top">
										<text class="pick-rank">#{{ pick.rank || '-' }}</text>
										<text class="pick-name">{{ pick.target_name || '-' }}</text>
										<text class="pick-nickname">{{ pick.target_nickname || '未填写昵称' }}</text>
										<text class="pick-mbti">{{ pick.target_mbti || 'MBTI 未知' }}</text>
										<text class="pick-state" :class="pick.is_mutual ? 'pick-state is-mutual' : 'pick-state is-single'">
											{{ pick.is_mutual ? '已回选' : '单向记录' }}
										</text>
									</view>
									<text class="pick-openid">对象 OpenID：{{ pick.target_wx_openid || '-' }}</text>
									<view class="pick-score-row">
										<text class="pick-score">本次分 {{ pick.score }}</text>
										<text class="pick-score">对向分 {{ pick.reciprocal_score }}</text>
										<text class="pick-score score-strong">合计分 {{ pick.combined_score }}</text>
									</view>
									<text class="pick-meta">
										对向信息：{{ pick.reciprocal_record_name || '未找到对向记录' }}
										{{ pick.reciprocal_rank_text }}
									</text>
								</view>
							</view>
							<view v-else class="detail-empty">
								<text>该提交人暂无意向条目</text>
							</view>
						</view>
					</block>
				</view>
			</scroll-view>

			<view v-if="filteredRecordList.length > pagination.pageSize" class="table-pagination">
				<uni-pagination
					show-icon
					:current="pagination.page"
					:page-size="pagination.pageSize"
					:total="filteredRecordList.length"
					@change="handlePageChange"
				/>
			</view>
		</view>
	</view>
</template>

<script>
var db = null
if (typeof uniCloud !== 'undefined' && uniCloud.database) {
	db = uniCloud.database()
}

const PERSONNEL_PROFILE_STORAGE_KEY = 'mbtiPersonnelProfile'
const MATCH_VOTE_COLLECTION = 'mbti-match-vote'
const STATUS_OPTIONS = [
	{ value: 'all', label: '全部状态' },
	{ value: 'draft', label: '草稿' },
	{ value: 'submitted', label: '已提交' },
	{ value: 'locked', label: '已锁定' }
]

function normalizeText(value) {
	return String(value || '').trim()
}

function normalizeKeyword(value) {
	return normalizeText(value).toLowerCase()
}

function normalizeOpenid(value) {
	return normalizeText(value)
}

function toNumber(value) {
	var num = Number(value)
	return Number.isFinite(num) ? num : 0
}

function isDeletedRecord(value) {
	return (
		value === true ||
		value === 1 ||
		value === '1' ||
		String(value || '').toLowerCase() === 'true'
	)
}

function resolveTimeMs(value) {
	if (!value) {
		return 0
	}
	if (value instanceof Date) {
		return value.getTime()
	}
	if (typeof value === 'number') {
		return value > 1000000000000 ? value : value * 1000
	}
	if (typeof value === 'string') {
		var stringTime = Date.parse(value)
		return Number.isNaN(stringTime) ? 0 : stringTime
	}
	if (typeof value === 'object') {
		if (typeof value.getTime === 'function') {
			return value.getTime()
		}
		if (typeof value.toDate === 'function') {
			var converted = value.toDate()
			return converted instanceof Date ? converted.getTime() : 0
		}
		if (typeof value.$date === 'number') {
			return value.$date
		}
		if (typeof value.value === 'number') {
			return value.value
		}
		if (typeof value.timestamp === 'number') {
			return value.timestamp
		}
		if (typeof value.seconds === 'number') {
			return value.seconds * 1000
		}
	}
	return 0
}

export default {
	data() {
		return {
			currentUserRole: 0,
			accessChecked: false,
			loading: false,
			keyword: '',
			statusFilter: 'all',
			statusOptions: STATUS_OPTIONS,
			recordList: [],
			pagination: {
				page: 1,
				pageSize: 6
			}
		}
	},
	computed: {
		filteredRecordList() {
			var keyword = normalizeKeyword(this.keyword)
			var currentStatus = this.statusFilter
			return this.recordList.filter(function (item) {
				if (currentStatus !== 'all' && item.submit_status !== currentStatus) {
					return false
				}
				if (!keyword) {
					return true
				}

				var textPool = [
					item.activity_id,
					item.creator_name,
					item.creator_nickname,
					String(item.creator_person_id || ''),
					item.creator_wx_openid,
					item.submit_status
				]

				for (var i = 0; i < item.pickViews.length; i += 1) {
					var pick = item.pickViews[i]
					textPool.push(
						pick.target_name,
						pick.target_nickname,
						pick.target_mbti,
						pick.target_wx_openid,
						String(pick.rank || ''),
						String(pick.combined_score || '')
					)
				}

				return textPool.some(function (text) {
					return normalizeKeyword(text).indexOf(keyword) !== -1
				})
			})
		},
		pagedRecordList() {
			var page = Number(this.pagination.page) || 1
			var pageSize = Number(this.pagination.pageSize) || 6
			var start = (page - 1) * pageSize
			return this.filteredRecordList.slice(start, start + pageSize)
		},
		summaryStats() {
			var totalPicks = 0
			var mutualPicks = 0
			for (var i = 0; i < this.filteredRecordList.length; i += 1) {
				totalPicks += Number(this.filteredRecordList[i].pickViews.length) || 0
				mutualPicks += Number(this.filteredRecordList[i].mutual_pick_count) || 0
			}
			return {
				totalRecords: this.recordList.length,
				filteredRecords: this.filteredRecordList.length,
				totalPicks: totalPicks,
				mutualPicks: mutualPicks
			}
		}
	},
	watch: {
		keyword() {
			this.pagination.page = 1
		},
		statusFilter() {
			this.pagination.page = 1
		}
	},
	onLoad() {
		this.currentUserRole = this.getCurrentUserRole()
		if (!this.ensurePageAccess()) {
			return
		}
		this.accessChecked = true
		this.loadRecordList()
	},
	methods: {
		getCurrentUserRole() {
			try {
				var profile = uni.getStorageSync(PERSONNEL_PROFILE_STORAGE_KEY)
				return Number(profile && profile.user_role) || 0
			} catch (error) {
				console.error('getCurrentUserRole failed', error)
				return 0
			}
		},
		ensurePageAccess() {
			if (Number(this.currentUserRole) >= 1) {
				return true
			}
			uni.showModal({
				title: '权限不足',
				content: '当前账号暂无查看意向记录页面的权限。',
				showCancel: false,
				success: () => {
					this.goBack()
				}
			})
			return false
		},
		goBack() {
			var pageStack = getCurrentPages()
			if (pageStack.length > 1) {
				uni.navigateBack({ delta: 1 })
				return
			}
			uni.reLaunch({ url: '/pkg/guide/hub' })
		},
		changeStatus(value) {
			this.statusFilter = value
		},
		handlePageChange(event) {
			var current = Number(event && event.current)
			this.pagination.page = current > 0 ? current : 1
		},
		buildRecordKey(activityId, openid) {
			return [normalizeText(activityId), normalizeOpenid(openid)].join('::')
		},
		normalizePickList(list) {
			var sourceList = Array.isArray(list) ? list.slice() : []
			return sourceList
				.map(function (item, index) {
					return {
						key: normalizeText(item && item.target_record_id) || `pick-${index}`,
						target_record_id: normalizeText(item && item.target_record_id),
						target_person_id: toNumber(item && item.target_person_id),
						target_user_id: normalizeText(item && item.target_user_id),
						target_wx_openid: normalizeOpenid(item && item.target_wx_openid),
						target_name: normalizeText(item && item.target_name),
						target_nickname: normalizeText(item && item.target_nickname),
						target_mbti: normalizeText(item && item.target_mbti).toUpperCase(),
						rank: toNumber(item && item.rank),
						score: toNumber(item && item.score),
						remark: normalizeText(item && item.remark)
					}
				})
				.sort(function (a, b) {
					if (a.rank && b.rank && a.rank !== b.rank) {
						return a.rank - b.rank
					}
					if (a.rank && !b.rank) {
						return -1
					}
					if (!a.rank && b.rank) {
						return 1
					}
					return a.target_person_id - b.target_person_id
				})
		},
		buildRecordViewList(rawList) {
			var activeList = (Array.isArray(rawList) ? rawList : []).filter(function (item) {
				return !isDeletedRecord(item && item.is_deleted)
			})

			var normalizedList = activeList.map(
				function (item) {
					return {
						_id: normalizeText(item && item._id),
						activity_id: normalizeText(item && item.activity_id),
						creator_record_id: normalizeText(item && item.creator_record_id),
						creator_person_id: toNumber(item && item.creator_person_id),
						creator_user_id: normalizeText(item && item.creator_user_id),
						creator_wx_openid: normalizeOpenid(item && item.creator_wx_openid),
						creator_name: normalizeText(item && item.creator_name),
						creator_nickname: normalizeText(item && item.creator_nickname),
						pick_count: toNumber(item && item.pick_count),
						total_score: toNumber(item && item.total_score),
						submit_status: normalizeText(item && item.submit_status) || 'draft',
						submitted_at: (item && item.submitted_at) || '',
						deadline_at: (item && item.deadline_at) || '',
						created_at: (item && item.created_at) || '',
						updated_at: (item && item.updated_at) || '',
						picks: this.normalizePickList(item && item.picks)
					}
				}.bind(this)
			)

			var recordMap = {}
			normalizedList.forEach(
				function (item) {
					if (!item.creator_wx_openid) {
						return
					}
					recordMap[this.buildRecordKey(item.activity_id, item.creator_wx_openid)] = item
				}.bind(this)
			)

			return normalizedList
				.map(
					function (item) {
						var linkedScoreTotal = 0
						var mutualPickCount = 0
						var pickViews = item.picks.map(
							function (pick, index) {
								var reciprocalRecord = pick.target_wx_openid
									? recordMap[this.buildRecordKey(item.activity_id, pick.target_wx_openid)]
									: null
								var reciprocalPick = null
								if (reciprocalRecord && Array.isArray(reciprocalRecord.picks)) {
									reciprocalPick =
										reciprocalRecord.picks.find(function (targetPick) {
											return (
												normalizeOpenid(targetPick && targetPick.target_wx_openid) ===
												item.creator_wx_openid
											)
										}) || null
								}
								var reciprocalScore = reciprocalPick ? toNumber(reciprocalPick.score) : 0
								var combinedScore = toNumber(pick.score) + reciprocalScore
								if (reciprocalPick) {
									mutualPickCount += 1
								}
								linkedScoreTotal += combinedScore
								return {
									key: `${item._id || item.creator_record_id || 'record'}-${index}`,
									target_record_id: pick.target_record_id,
									target_person_id: pick.target_person_id,
									target_wx_openid: pick.target_wx_openid,
									target_name: pick.target_name,
									target_nickname: pick.target_nickname,
									target_mbti: pick.target_mbti,
									rank: pick.rank,
									score: pick.score,
									is_mutual: !!reciprocalPick,
									reciprocal_score: reciprocalScore,
									reciprocal_rank: reciprocalPick ? toNumber(reciprocalPick.rank) : 0,
									reciprocal_rank_text:
										reciprocalPick && toNumber(reciprocalPick.rank)
											? ` · 对向排名 #${toNumber(reciprocalPick.rank)}`
											: '',
									reciprocal_record_name: reciprocalRecord
										? reciprocalRecord.creator_name || reciprocalRecord.creator_nickname || '已找到对向记录'
										: '',
									combined_score: combinedScore
								}
							}.bind(this)
						)

						return {
							...item,
							mutual_pick_count: mutualPickCount,
							linked_score_total: linkedScoreTotal,
							pickViews: pickViews
						}
					}.bind(this)
				)
				.sort(function (a, b) {
					var timeDiff = resolveTimeMs(b.updated_at) - resolveTimeMs(a.updated_at)
					if (timeDiff !== 0) {
						return timeDiff
					}
					if (a.activity_id !== b.activity_id) {
						return a.activity_id.localeCompare(b.activity_id)
					}
					return a.creator_person_id - b.creator_person_id
				})
		},
		async fetchAllRecords() {
			var pageSize = 500
			var page = 0
			var allList = []

			while (true) {
				var res = await db
					.collection(MATCH_VOTE_COLLECTION)
					.field(
						'_id,activity_id,creator_record_id,creator_person_id,creator_user_id,creator_wx_openid,creator_name,creator_nickname,picks,pick_count,total_score,submit_status,submitted_at,deadline_at,is_deleted,created_at,updated_at'
					)
					.orderBy('updated_at', 'desc')
					.skip(page * pageSize)
					.limit(pageSize)
					.get()

				var currentList = (res.result && res.result.data) || res.data || []
				if (!currentList.length) {
					break
				}

				allList = allList.concat(currentList)
				if (currentList.length < pageSize) {
					break
				}

				page += 1
			}

			return allList
		},
		async loadRecordList() {
			if (!this.accessChecked) {
				return
			}
			if (!db) {
				uni.showModal({
					content: '当前环境不支持云数据库查询。',
					showCancel: false
				})
				return
			}
			this.loading = true
			try {
				var list = await this.fetchAllRecords()
				this.recordList = this.buildRecordViewList(list)
				this.pagination.page = 1
			} catch (error) {
				console.error('loadRecordList failed', error)
				uni.showToast({
					title: error.message || '记录加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		statusText(status) {
			if (status === 'submitted') {
				return '已提交'
			}
			if (status === 'locked') {
				return '已锁定'
			}
			return '草稿'
		},
		statusClass(status) {
			if (status === 'submitted') {
				return 'status-submitted'
			}
			if (status === 'locked') {
				return 'status-locked'
			}
			return 'status-draft'
		},
		formatDate(value) {
			if (!value) {
				return '-'
			}
			var time = resolveTimeMs(value)
			if (!time) {
				var text = normalizeText(value)
				return text ? text.replace('T', ' ').slice(0, 19) : '-'
			}
			var date = new Date(time)
			var year = date.getFullYear()
			var month = `${date.getMonth() + 1}`.padStart(2, '0')
			var day = `${date.getDate()}`.padStart(2, '0')
			var hours = `${date.getHours()}`.padStart(2, '0')
			var minutes = `${date.getMinutes()}`.padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}`
		}
	}
}
</script>

<style>
.page {
	min-height: 100vh;
	padding: 24rpx;
	background: #f5efe5;
	box-sizing: border-box;
}

.toolbar {
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 20rpx;
}

.panel-card,
.stat-card {
	background: #fffcf7;
	border: 1rpx solid #eadfce;
	border-radius: 28rpx;
	box-shadow: 0 18rpx 40rpx rgba(91, 70, 40, 0.08);
}

.panel-card {
	padding: 32rpx 28rpx;
	margin-bottom: 24rpx;
}

.card-head {
	display: flex;
	flex-direction: column;
}

.card-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #2d241c;
}

.card-tip,
.secondary-text,
.pick-meta,
.pick-openid,
.detail-summary {
	margin-top: 16rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #716250;
}

.stats-wrap,
.status-row,
.pick-top,
.pick-score-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}

.stats-wrap {
	justify-content: space-between;
	margin-top: 24rpx;
}

.stat-card {
	width: 48%;
	margin-bottom: 20rpx;
	padding: 24rpx;
	box-sizing: border-box;
}

.stat-label {
	font-size: 24rpx;
	color: #7c6b57;
}

.stat-value {
	margin-top: 12rpx;
	margin-left: 12rpx;
	font-size: 40rpx;
	font-weight: 700;
	color: #2e241b;
}

.search-input {
	width: 100%;
	height: 84rpx;
	padding: 0 24rpx;
	line-height: 84rpx;
	margin-top: 24rpx;
	background: #fbf8f2;
	border: 1rpx solid #dfd3c1;
	border-radius: 20rpx;
	box-sizing: border-box;
	color: #342b22;
	font-size: 26rpx;
}

.status-scroll {
	width: 100%;
	margin-top: 20rpx;
}

.status-row {
	padding-bottom: 8rpx;
}

.status-chip {
	padding: 14rpx 24rpx;
	margin-right: 16rpx;
	border-radius: 999rpx;
	background: #efe5d3;
	color: #6d4e2c;
	font-size: 24rpx;
	white-space: nowrap;
}

.status-chip.active {
	background: #1f6b52;
	color: #ffffff;
}

.table-scroll {
	width: 100%;
	margin-top: 24rpx;
}

.table {
	min-width: 1980rpx;
}

.table-row {
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	border-bottom: 1rpx solid #eadfce;
}

.table-header {
	background: #f4ecde;
	border-radius: 20rpx 20rpx 0 0;
}

.body-row {
	background: rgba(255, 255, 255, 0.72);
}

.col {
	padding: 22rpx 16rpx;
	font-size: 24rpx;
	color: #46382b;
	box-sizing: border-box;
	white-space: nowrap;
}

.col-activity { width: 220rpx; }
.col-person { width: 260rpx; }
.col-openid {
	width: 320rpx;
	white-space: normal;
	word-break: break-all;
}
.col-status { width: 160rpx; }
.col-count { width: 120rpx; }
.col-score { width: 140rpx; }
.col-time { width: 220rpx; }

.person-cell {
	display: flex;
	flex-direction: column;
}

.primary-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #2d241c;
}

.person-cell .secondary-text {
	margin-top: 10rpx;
}

.openid-text {
	line-height: 1.6;
}

.status-pill,
.pick-state,
.pick-mbti {
	display: inline-flex;
	align-items: center;
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	white-space: nowrap;
}

.status-draft {
	background: #efe5d3;
	color: #6d4e2c;
}

.status-submitted {
	background: #dff4e8;
	color: #1e6b45;
}

.status-locked {
	background: #fce3ad;
	color: #7a4a12;
}

.score-strong {
	font-weight: 700;
	color: #1f6b52;
}

.detail-panel {
	padding: 24rpx;
	border-bottom: 1rpx solid #eadfce;
	background: #fffaf3;
}

.detail-head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
}

.detail-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #2d241c;
}

.detail-summary {
	margin-top: 0;
}

.pick-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-top: 20rpx;
}

.pick-card {
	width: 49%;
	margin-bottom: 18rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: #ffffff;
	border: 1rpx solid #eadfce;
	box-sizing: border-box;
}

.pick-rank {
	font-size: 24rpx;
	font-weight: 700;
	color: #1f6b52;
}

.pick-name {
	margin-left: 14rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #2d241c;
}

.pick-nickname {
	margin-left: 12rpx;
	font-size: 24rpx;
	color: #716250;
}

.pick-mbti {
	margin-left: 12rpx;
	background: #f3eadb;
	color: #5e472e;
}

.pick-state {
	margin-left: auto;
}

.pick-state.is-mutual {
	background: #dff4e8;
	color: #1e6b45;
}

.pick-state.is-single {
	background: #efe5d3;
	color: #6d4e2c;
}

.pick-openid,
.pick-meta {
	display: block;
	word-break: break-all;
}

.pick-score-row {
	margin-top: 14rpx;
}

.pick-score {
	margin-right: 18rpx;
	font-size: 24rpx;
	color: #46382b;
}

.detail-empty,
.empty-box {
	padding: 44rpx 24rpx;
	font-size: 26rpx;
	color: #857362;
	text-align: center;
}

.table-pagination {
	padding-top: 24rpx;
	display: flex;
	justify-content: flex-end;
}

.solid-btn,
.ghost-btn {
	height: 76rpx;
	line-height: 76rpx;
	padding: 0 28rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	margin: 0 20rpx 0 0;
}

.solid-btn {
	background: #1f6b52;
	color: #ffffff;
}

.ghost-btn {
	background: #efe5d3;
	color: #6d4e2c;
}

@media screen and (max-width: 768px) {
	.pick-card {
		width: 100%;
	}
}
</style>
