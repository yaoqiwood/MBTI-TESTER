<template>
	<view class="page">
		<view class="toolbar">
			<button class="ghost-btn" @click="goBack">返回上一页</button>
			<button class="solid-btn" @click="loadPairGroups">刷新查询</button>
		</view>

		<view class="summary-card">
			<text class="summary-title">MBTI 组合配对查询</text>
			<view class="summary-stats">
				<view class="stat-item">
					<text class="stat-label">总人数</text>
					<text class="stat-value">{{ totalMembers }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">可配对人数</text>
					<text class="stat-value">{{ validMembers }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">配对数量</text>
					<text class="stat-value">{{ totalPairs }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">分组数</text>
					<text class="stat-value">{{ groupList.length }}</text>
				</view>
			</view>
		</view>

		<view class="filter-card">
			<input
				v-model.trim="filterKeyword"
				class="search-input"
				placeholder="筛选组合 / 别名 / 成员姓名 / MBTI"
				confirm-type="search"
			/>
			<text class="filter-tip">支持按组合、别名、成员姓名或 MBTI 关键词筛选</text>
		</view>

		<view v-if="loading" class="state-box state-panel">
			<text>正在计算组合，请稍候...</text>
		</view>
		<view v-else-if="!groupList.length" class="state-box state-panel">
			<text>暂无可配对数据，请先补充人员 MBTI。</text>
		</view>
		<view v-else-if="!displayGroupList.length" class="state-box state-panel">
			<text>当前筛选条件下暂无匹配组合。</text>
		</view>

		<view v-else class="result-panel" @click="closeMemberDetail">
			<scroll-view class="group-list-scroll" scroll-y>
				<view class="group-list">
					<view v-for="group in pagedGroupList" :key="group.key" class="group-card">
						<view class="group-head">
							<text class="group-name"
								>{{ group.name
								}}<text v-if="group.subname" class="group-subname"
									>（{{ group.subname }}）</text
								></text
							>
							<text class="group-meta">{{ group.pairs.length }} 对</text>
						</view>
						<text class="group-combos"
							>组合：{{ group.comboSummary }}｜成员池：{{ group.memberSummary }}</text
						>

						<scroll-view class="table-scroll" scroll-x @click.stop>
							<view class="table">
								<view class="table-row table-header">
									<!-- <text class="col col-combo">组合</text> -->
									<text class="col col-member">{{ group.leftMbti }} 成员</text>
									<text class="col col-member">{{ group.rightMbti }} 成员</text>
								</view>
								<block v-for="pair in group.pairs" :key="pair.key">
									<view class="table-row">
										<!-- <text class="col col-combo">{{ pair.comboKey }}</text> -->
										<view
											class="col col-member member-cell"
											:class="
												selectedDetailTarget &&
												selectedDetailTarget.pairKey === pair.key &&
												selectedDetailTarget.side === 'left'
													? 'member-cell active'
													: ''
											"
											@click.stop="toggleMemberDetail(pair, 'left')"
										>
											<text class="member-link">{{ pair.leftName }}（{{ pair.leftMbti }}）</text>
										</view>
										<view
											class="col col-member member-cell"
											:class="
												selectedDetailTarget &&
												selectedDetailTarget.pairKey === pair.key &&
												selectedDetailTarget.side === 'right'
													? 'member-cell active'
													: ''
											"
											@click.stop="toggleMemberDetail(pair, 'right')"
										>
											<text class="member-link">{{ pair.rightName }}（{{ pair.rightMbti }}）</text>
										</view>
									</view>
									<view v-if="isPairMemberSelected(pair)" class="detail-row" @click.stop>
										<view class="member-detail-card">
											<view class="member-detail-head">
												<view>
													<text class="member-detail-title">{{
														selectedMemberDetail.displayName || '-'
													}}</text>
													<text class="member-detail-subtitle"
														>编号：{{ selectedMemberDetail.person_id || '-' }} · MBTI：{{
															selectedMemberDetail.mbti || '-'
														}}</text
													>
												</view>
												<text class="member-detail-close" @click.stop="closeMemberDetail"
													>收起</text
												>
											</view>
											<!-- <text class="member-detail-tip">点击其他空白区域也可收起</text> -->
											<image
												v-if="selectedMemberDetail.personal_photo"
												class="member-detail-photo"
												:src="selectedMemberDetail.personal_photo"
												mode="aspectFill"
											></image>
											<view class="member-detail-grid">
												<text class="member-detail-item"
													>姓名：{{ selectedMemberDetail.name || '-' }}</text
												>
												<text class="member-detail-item"
													>昵称：{{ selectedMemberDetail.nickname || '-' }}</text
												>
												<text class="member-detail-item"
													>性别：{{ selectedMemberDetail.gender || '-' }}</text
												>
												<text class="member-detail-item"
													>年龄：{{ selectedMemberDetail.age || '-' }}</text
												>
												<text class="member-detail-item"
													>手机：{{ selectedMemberDetail.mobile || '-' }}</text
												>
												<text class="member-detail-item"
													>籍贯：{{ selectedMemberDetail.native_place || '-' }}</text
												>
												<text class="member-detail-item"
													>职业：{{ selectedMemberDetail.profession || '-' }}</text
												>
												<text class="member-detail-item"
													>教会：{{ selectedMemberDetail.church || '-' }}</text
												>
												<text class="member-detail-item"
													>推荐人：{{ selectedMemberDetail.referrer || '-' }}</text
												>
												<text class="member-detail-item"
													>感情状态：{{ selectedMemberDetail.relationship_status || '-' }}</text
												>
												<text class="member-detail-item"
													>出行方式：{{ selectedMemberDetail.travel_mode || '-' }}</text
												>
											</view>
											<view v-if="selectedMemberDetail.address" class="member-detail-block">
												<text class="member-detail-block-title">地址</text>
												<text class="member-detail-block-text">{{
													selectedMemberDetail.address
												}}</text>
											</view>
											<view v-if="selectedMemberDetail.family_overview" class="member-detail-block">
												<text class="member-detail-block-title">家庭概况</text>
												<text class="member-detail-block-text">{{
													selectedMemberDetail.family_overview
												}}</text>
											</view>
											<view
												v-if="selectedMemberDetail.self_introduction"
												class="member-detail-block"
											>
												<text class="member-detail-block-title">自我介绍</text>
												<text class="member-detail-block-text">{{
													selectedMemberDetail.self_introduction
												}}</text>
											</view>
										</view>
									</view>
								</block>
							</view>
						</scroll-view>
					</view>
				</view>
			</scroll-view>
			<view v-if="paginationTotal > pagination.pageSize" class="pagination-wrap">
				<view
					class="pager-btn"
					:class="isFirstPage ? 'pager-btn is-disabled' : ''"
					@click="goPrevPage"
					>上一页</view
				>
				<text class="pager-text">第 {{ pagination.page }} / {{ totalPages }} 页</text>
				<view
					class="pager-btn"
					:class="isLastPage ? 'pager-btn is-disabled' : ''"
					@click="goNextPage"
					>下一页</view
				>
			</view>
		</view>
	</view>
</template>

<script>
	import relationshipSource from '../../static/json/mbti_16x16_relationships_full.json'

	var db = null
	if (typeof uniCloud !== 'undefined' && uniCloud.database) {
		db = uniCloud.database()
	}

	var RELATIONSHIP_LIST = (relationshipSource && relationshipSource.mbti_relationships_full) || []

	function normalizeMbtiValue(value) {
		return String(value || '')
			.trim()
			.toUpperCase()
	}

	function buildComboKey(typeA, typeB) {
		var comboTypes = [normalizeMbtiValue(typeA), normalizeMbtiValue(typeB)]
			.filter(function (item) {
				return !!item
			})
			.sort()

		return comboTypes.join('+')
	}

	function buildRelationshipConfigs(list) {
		var configList = []
		var configMap = {}

		for (var i = 0; i < list.length; i++) {
			var item = list[i] || {}
			var comboKey = buildComboKey(item.type_a, item.type_b)
			if (!comboKey || configMap[comboKey]) {
				continue
			}

			var comboTypes = comboKey.split('+')
			var config = {
				key: comboKey,
				comboKey: comboKey,
				leftMbti: comboTypes[0] || '',
				rightMbti: comboTypes[1] || comboTypes[0] || '',
				subname: String(item.cp_name || '').trim(),
				relationshipLevel: String(item.relationship_level || '').trim(),
				compatibilityScore: Number(item.compatibility_score) || 0
			}

			configList.push(config)
			configMap[comboKey] = config
		}

		return {
			list: configList,
			map: configMap
		}
	}

	var RELATIONSHIP_CONFIGS = buildRelationshipConfigs(RELATIONSHIP_LIST)
	var RELATIONSHIP_CONFIG_LIST = RELATIONSHIP_CONFIGS.list
	var RELATIONSHIP_CONFIG_MAP = RELATIONSHIP_CONFIGS.map
	var SUPPORTED_MBTI_MAP = {}

	for (
		var relationshipIndex = 0;
		relationshipIndex < RELATIONSHIP_CONFIG_LIST.length;
		relationshipIndex++
	) {
		var relationshipConfig = RELATIONSHIP_CONFIG_LIST[relationshipIndex]
		SUPPORTED_MBTI_MAP[relationshipConfig.leftMbti] = true
		SUPPORTED_MBTI_MAP[relationshipConfig.rightMbti] = true
	}

	export default {
		data() {
			return {
				loading: false,
				totalMembers: 0,
				validMembers: 0,
				totalPairs: 0,
				groupList: [],
				selectedMemberDetail: null,
				selectedDetailTarget: null,
				filterKeyword: '',
				pagination: {
					page: 1,
					pageSize: 5
				}
			}
		},
		computed: {
			displayGroupList() {
				var keyword = this.normalizeKeyword(this.filterKeyword)
				if (!keyword) {
					return this.groupList
				}

				return this.groupList
					.map(
						function (group) {
							var matchedPairs = group.pairs.filter(
								function (pair) {
									return this.matchesGroupKeyword(group, pair, keyword)
								}.bind(this)
							)

							if (!matchedPairs.length) {
								return null
							}

							return Object.assign({}, group, {
								pairs: matchedPairs
							})
						}.bind(this)
					)
					.filter(function (group) {
						return !!group
					})
			},
			paginationTotal() {
				return this.displayGroupList.length
			},
			totalPages() {
				return Math.max(1, Math.ceil(this.paginationTotal / Number(this.pagination.pageSize || 5)))
			},
			isFirstPage() {
				return Number(this.pagination.page || 1) <= 1
			},
			isLastPage() {
				return Number(this.pagination.page || 1) >= this.totalPages
			},
			pagedGroupList() {
				var pageSize = Number(this.pagination.pageSize || 5)
				var total = this.displayGroupList.length
				var maxPage = Math.max(1, Math.ceil(total / pageSize))
				var currentPage = Number(this.pagination.page || 1)
				if (currentPage < 1) {
					currentPage = 1
				}
				if (currentPage > maxPage) {
					currentPage = maxPage
				}
				var start = (currentPage - 1) * pageSize
				return this.displayGroupList.slice(start, start + pageSize)
			}
		},
		watch: {
			filterKeyword() {
				this.resetPagination()
			},
			groupList() {
				this.resetPagination()
			},
			displayGroupList(list) {
				this.syncPagination(list.length)
			}
		},
		onLoad() {
			this.loadPairGroups()
		},
		methods: {
			goBack() {
				var pageStack = getCurrentPages()
				if (pageStack.length > 1) {
					uni.navigateBack({ delta: 1 })
					return
				}
				uni.reLaunch({
					url: '/pages/adminHome/gameQueryManagement'
				})
			},
			normalizeMbti(value) {
				return normalizeMbtiValue(value)
			},
			normalizeKeyword(value) {
				return String(value || '')
					.trim()
					.toUpperCase()
			},
			getDisplayName(item) {
				return item.nickname || item.name || '#' + (item.person_id || '未知')
			},
			toggleMemberDetail(pair, side) {
				var member = side === 'right' ? pair && pair.rightMember : pair && pair.leftMember
				if (!pair || !member || !member._id) {
					return
				}
				if (
					this.selectedDetailTarget &&
					this.selectedDetailTarget.pairKey === pair.key &&
					this.selectedDetailTarget.side === side &&
					this.selectedDetailTarget.memberId === member._id
				) {
					this.selectedMemberDetail = null
					this.selectedDetailTarget = null
					return
				}
				this.selectedMemberDetail = member
				this.selectedDetailTarget = {
					pairKey: pair.key,
					side: side,
					memberId: member._id
				}
			},
			closeMemberDetail() {
				this.selectedMemberDetail = null
				this.selectedDetailTarget = null
			},
			isPairMemberSelected(pair) {
				if (!this.selectedMemberDetail || !this.selectedDetailTarget || !pair) {
					return false
				}
				return this.selectedDetailTarget.pairKey === pair.key
			},
			isSupportedMbti(value) {
				return !!SUPPORTED_MBTI_MAP[this.normalizeMbti(value)]
			},
			getGroupConfig(comboKey) {
				return RELATIONSHIP_CONFIG_MAP[comboKey] || null
			},
			resetPagination() {
				this.pagination.page = 1
			},
			syncPagination(total) {
				var pageSize = Number(this.pagination.pageSize || 5)
				var maxPage = Math.max(1, Math.ceil(Number(total || 0) / pageSize))
				if (this.pagination.page > maxPage) {
					this.pagination.page = maxPage
				}
				if (this.pagination.page < 1) {
					this.pagination.page = 1
				}
			},
			goPrevPage() {
				if (this.isFirstPage) {
					return
				}
				this.pagination.page = Number(this.pagination.page || 1) - 1
			},
			goNextPage() {
				if (this.isLastPage) {
					return
				}
				this.pagination.page = Number(this.pagination.page || 1) + 1
			},
			resolveGroupName(comboKey) {
				return comboKey + '组'
			},
			matchesGroupKeyword(group, pair, keyword) {
				var haystack = [
					group.name,
					group.subname,
					group.comboSummary,
					group.memberSummary,
					group.leftMbti,
					group.rightMbti,
					pair.comboKey,
					pair.leftName,
					pair.leftMbti,
					pair.rightName,
					pair.rightMbti
				]
					.join('|')
					.toUpperCase()

				return haystack.indexOf(keyword) !== -1
			},
			buildMemberBucketMap(members) {
				var bucketMap = {}

				for (var i = 0; i < members.length; i++) {
					var member = members[i]
					if (!bucketMap[member.mbti]) {
						bucketMap[member.mbti] = []
					}
					bucketMap[member.mbti].push(member)
				}

				return bucketMap
			},
			createPairRecord(comboKey, left, right) {
				return {
					key: comboKey + '__' + left._id + '_' + right._id,
					comboKey: comboKey,
					leftName: left.displayName,
					leftMbti: left.mbti,
					leftMember: left,
					rightName: right.displayName,
					rightMbti: right.mbti,
					rightMember: right
				}
			},
			buildGroupPairs(config, bucketMap) {
				var leftMembers = bucketMap[config.leftMbti] || []
				var rightMembers = bucketMap[config.rightMbti] || []
				var pairs = []

				if (config.leftMbti === config.rightMbti) {
					for (var i = 0; i < leftMembers.length; i++) {
						for (var j = i + 1; j < leftMembers.length; j++) {
							pairs.push(this.createPairRecord(config.comboKey, leftMembers[i], leftMembers[j]))
						}
					}
				} else {
					for (var leftIndex = 0; leftIndex < leftMembers.length; leftIndex++) {
						for (var rightIndex = 0; rightIndex < rightMembers.length; rightIndex++) {
							pairs.push(
								this.createPairRecord(
									config.comboKey,
									leftMembers[leftIndex],
									rightMembers[rightIndex]
								)
							)
						}
					}
				}

				return {
					pairs: pairs,
					leftCount: leftMembers.length,
					rightCount: rightMembers.length
				}
			},
			buildPairGroups(members) {
				var bucketMap = this.buildMemberBucketMap(members)
				var groupList = []
				var total = 0

				for (var i = 0; i < RELATIONSHIP_CONFIG_LIST.length; i++) {
					var config = RELATIONSHIP_CONFIG_LIST[i]
					var pairData = this.buildGroupPairs(config, bucketMap)
					if (!pairData.pairs.length) {
						continue
					}

					total += pairData.pairs.length
					groupList.push({
						key: config.key,
						name: this.resolveGroupName(config.comboKey),
						subname: config.subname,
						comboKey: config.comboKey,
						comboSummary: config.comboKey,
						leftMbti: config.leftMbti,
						rightMbti: config.rightMbti,
						memberSummary:
							config.leftMbti === config.rightMbti
								? config.leftMbti + '：' + pairData.leftCount + ' 人'
								: config.leftMbti +
									'：' +
									pairData.leftCount +
									' 人 / ' +
									config.rightMbti +
									'：' +
									pairData.rightCount +
									' 人',
						compatibilityScore: config.compatibilityScore,
						pairs: pairData.pairs
					})
				}

				groupList.sort(function (a, b) {
					if (b.pairs.length !== a.pairs.length) {
						return b.pairs.length - a.pairs.length
					}
					if (b.compatibilityScore !== a.compatibilityScore) {
						return b.compatibilityScore - a.compatibilityScore
					}
					return a.comboKey.localeCompare(b.comboKey)
				})

				return {
					totalPairs: total,
					groupList: groupList
				}
			},
			async fetchAllPersonnel() {
				var pageSize = 500
				var page = 0
				var allList = []

				while (true) {
					var res = await db
						.collection('mbti-personnel')
						.field(
							'_id,person_id,nickname,name,gender,age,personal_photo,mobile,mbti,native_place,profession,address,family_overview,church,referrer,self_introduction,relationship_status,travel_mode,is_deleted'
						)
						.orderBy('person_id', 'asc')
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
			async loadPairGroups() {
				if (!db) {
					uni.showModal({
						content: '当前环境不支持云数据库查询',
						showCancel: false
					})
					return
				}
				this.loading = true
				try {
					var list = await this.fetchAllPersonnel()
					var activeList = list.filter(function (item) {
						var deletedValue = item && item.is_deleted
						return !(
							deletedValue === true ||
							deletedValue === 1 ||
							deletedValue === '1' ||
							String(deletedValue || '').toLowerCase() === 'true'
						)
					})
					var members = activeList
						.map(
							function (item) {
								var mbti = this.normalizeMbti(item.mbti)
								if (!mbti || !this.isSupportedMbti(mbti)) {
									return null
								}
								return {
									_id: item._id,
									person_id: item.person_id,
									nickname: item.nickname || '',
									name: item.name || '',
									gender: item.gender || '',
									age: item.age,
									personal_photo: item.personal_photo || '',
									mobile: item.mobile || '',
									mbti: mbti,
									native_place: item.native_place || '',
									profession: item.profession || '',
									address: item.address || '',
									family_overview: item.family_overview || '',
									church: item.church || '',
									referrer: item.referrer || '',
									self_introduction: item.self_introduction || '',
									relationship_status: item.relationship_status || '',
									travel_mode: item.travel_mode || '',
									displayName: this.getDisplayName(item)
								}
							}.bind(this)
						)
						.filter(function (item) {
							return !!item
						})

					var result = this.buildPairGroups(members)
					this.selectedMemberDetail = null
					this.selectedDetailTarget = null
					this.totalMembers = activeList.length
					this.validMembers = members.length
					this.totalPairs = result.totalPairs
					this.groupList = result.groupList
					this.syncPagination(result.groupList.length)
				} catch (error) {
					uni.showModal({
						content: error.message || '查询失败，请稍后重试',
						showCancel: false
					})
				} finally {
					this.loading = false
				}
			}
		}
	}
</script>

<style>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 24rpx;
		background: #f5efe5;
		box-sizing: border-box;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.solid-btn,
	.ghost-btn {
		height: 68rpx;
		line-height: 68rpx;
		padding: 0 28rpx;
		border-radius: 999rpx;
		font-size: 24rpx;
		margin: 0;
	}

	.solid-btn {
		background: #1f6b52;
		color: #ffffff;
	}

	.ghost-btn {
		background: #efe5d3;
		color: #6d4e2c;
	}

	.summary-card,
	.filter-card,
	.group-card,
	.state-box {
		background: #fffcf7;
		border: 1rpx solid #eadfce;
		border-radius: 24rpx;
		box-shadow: 0 14rpx 32rpx rgba(91, 70, 40, 0.08);
	}

	.summary-card {
		padding: 28rpx 24rpx;
	}

	.filter-card {
		margin-top: 20rpx;
		padding: 24rpx;
	}

	.search-input {
		height: 76rpx;
		padding: 0 24rpx;
		border-radius: 18rpx;
		background: #f6efe3;
		font-size: 24rpx;
		color: #2f261e;
		box-sizing: border-box;
	}

	.filter-tip {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #8a7560;
	}

	.summary-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.summary-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #716250;
	}

	.summary-stats {
		display: flex;
		flex-wrap: nowrap;
		justify-content: space-between;
		gap: 12rpx;
		margin-top: 20rpx;
	}

	.stat-item {
		flex: 1;
		min-width: 0;
		margin-bottom: 0;
	}

	.stat-label {
		display: block;
		font-size: 22rpx;
		color: #8a7560;
		white-space: nowrap;
	}

	.stat-value {
		display: block;
		margin-top: 6rpx;
		font-size: 32rpx;
		font-weight: 700;
		color: #2e241b;
	}

	.state-box {
		margin-top: 20rpx;
		padding: 40rpx 24rpx;
		font-size: 26rpx;
		text-align: center;
		color: #6d5a47;
	}

	.state-panel {
		flex: 1;
		min-height: 0;
	}

	.result-panel {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		margin-top: 20rpx;
	}

	.group-list-scroll {
		flex: 1;
		min-height: 0;
	}

	.group-list {
		padding-bottom: 8rpx;
	}

	.pagination-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		padding: 12rpx 0 4rpx;
	}

	.pager-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 160rpx;
		height: 64rpx;
		line-height: 64rpx;
		padding: 0 24rpx;
		border-radius: 999rpx;
		font-size: 24rpx;
		color: #6d4e2c;
		background: #efe5d3;
		margin: 0;
	}

	.pager-btn.is-disabled {
		opacity: 0.45;
	}

	.pager-text {
		font-size: 24rpx;
		color: #7a6652;
	}

	.group-card {
		padding: 24rpx;
		margin-bottom: 20rpx;
	}

	.group-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.group-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.group-meta {
		font-size: 22rpx;
		color: #8e7962;
	}

	.group-subname {
		display: inline;
		font-size: 25rpx;
		color: #8f6840;
	}

	.group-combos {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #7a6652;
	}

	.table-scroll {
		margin-top: 16rpx;
		white-space: nowrap;
	}

	.table {
		min-width: 860rpx;
	}

	.table-row {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #efe4d5;
	}

	.detail-row {
		padding: 0 0 20rpx;
		border-bottom: 1rpx solid #efe4d5;
	}

	.table-header {
		padding-top: 0;
		font-size: 22rpx;
		font-weight: 600;
		color: #8c745b;
	}

	.col {
		box-sizing: border-box;
		padding-right: 16rpx;
		font-size: 24rpx;
		color: #2f261e;
	}

	.col-combo {
		width: 220rpx;
	}

	.col-member {
		width: 320rpx;
	}

	.member-cell {
		cursor: pointer;
		padding: 8rpx 12rpx 8rpx 0;
		border-radius: 14rpx;
		transition: all 0.2s ease;
	}

	.member-cell.active {
		background: rgba(31, 107, 82, 0.1);
	}

	.member-link {
		color: #1f6b52;
		font-weight: 600;
	}

	.member-detail-card {
		padding: 24rpx;
		border-radius: 20rpx;
		background: #f8f3ea;
		border: 1rpx solid #eadfce;
	}

	.member-detail-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	.member-detail-title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.member-detail-subtitle {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #7a6652;
	}

	.member-detail-tip {
		display: block;
		margin-top: 12rpx;
		font-size: 21rpx;
		color: #9a8269;
	}

	.member-detail-close {
		font-size: 22rpx;
		color: #8f6840;
	}

	.member-detail-photo {
		display: block;
		width: 160rpx;
		height: 160rpx;
		margin-top: 20rpx;
		border-radius: 18rpx;
		background: #efe5d3;
	}

	.member-detail-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx 20rpx;
		margin-top: 20rpx;
	}

	.member-detail-item {
		width: calc(50% - 10rpx);
		font-size: 23rpx;
		color: #3c3228;
	}

	.member-detail-block {
		margin-top: 18rpx;
	}

	.member-detail-block-title {
		display: block;
		font-size: 22rpx;
		font-weight: 600;
		color: #8c745b;
	}

	.member-detail-block-text {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #2f261e;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>

