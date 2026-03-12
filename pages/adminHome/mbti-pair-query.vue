<template>
	<view class="page">
		<view class="toolbar">
			<button class="ghost-btn" @click="goBack">返回上一级</button>
			<button class="solid-btn" @click="loadPairGroups">刷新查询</button>
		</view>

		<view class="summary-card">
			<text class="summary-title">MBTI组合配对查询</text>
			<text class="summary-desc">数据源：mbti-personnel（仅统计有 MBTI 的人员）</text>
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
					<text class="stat-label">配对组合数</text>
					<text class="stat-value">{{ totalPairs }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">分组数</text>
					<text class="stat-value">{{ groupList.length }}</text>
				</view>
			</view>
		</view>

		<view v-if="loading" class="state-box">
			<text>正在计算组合，请稍候...</text>
		</view>
		<view v-else-if="!groupList.length" class="state-box">
			<text>暂无可配对数据，请先补充人员 MBTI。</text>
		</view>

		<view v-else class="group-list">
			<view v-for="group in groupList" :key="group.key" class="group-card">
				<view class="group-head">
					<text class="group-name">{{ group.name }}</text>
					<text class="group-meta">{{ group.pairs.length }} 组</text>
				</view>
				<text class="group-combos">覆盖组合：{{ group.comboSummary }}</text>

				<scroll-view class="table-scroll" scroll-x>
					<view class="table">
						<view class="table-row table-header">
							<text class="col col-combo">组合</text>
							<text class="col col-member">成员 A</text>
							<text class="col col-member">成员 B</text>
						</view>
						<view v-for="pair in group.pairs" :key="pair.key" class="table-row">
							<text class="col col-combo">{{ pair.comboKey }}</text>
							<text class="col col-member">{{ pair.leftName }}（{{ pair.leftMbti }}）</text>
							<text class="col col-member">{{ pair.rightName }}（{{ pair.rightMbti }}）</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	var db = null
	if (typeof uniCloud !== 'undefined' && uniCloud.database) {
		db = uniCloud.database()
	}

	var GROUP_NAME_MAP = {
		'ENFP+INTJ': '彩虹组'
	}

	export default {
		data() {
			return {
				loading: false,
				totalMembers: 0,
				validMembers: 0,
				totalPairs: 0,
				groupList: []
			}
		},
		onLoad() {
			this.loadPairGroups()
		},
		methods: {
			goBack() {
				var pageStack = getCurrentPages()
				if (pageStack.length > 1) {
					uni.navigateBack({
						delta: 1
					})
					return
				}
				uni.reLaunch({
					url: '/pages/adminHome/gameQueryManagement'
				})
			},
			normalizeMbti(value) {
				return String(value || '')
					.trim()
					.toUpperCase()
			},
			getDisplayName(item) {
				return item.nickname || item.name || ('#' + (item.person_id || '未知'))
			},
			resolveGroupName(comboKey) {
				return GROUP_NAME_MAP[comboKey] || comboKey + '组'
			},
			buildPairGroups(members) {
				var groupMap = {}
				var total = 0
				for (var i = 0; i < members.length; i++) {
					for (var j = i + 1; j < members.length; j++) {
						var left = members[i]
						var right = members[j]
						var comboKey = [left.mbti, right.mbti].sort().join('+')
						var groupName = this.resolveGroupName(comboKey)
						var groupKey = groupName + '__' + comboKey

						if (!groupMap[groupKey]) {
							groupMap[groupKey] = {
								key: groupKey,
								name: groupName,
								pairs: [],
								comboSet: {}
							}
						}

						groupMap[groupKey].comboSet[comboKey] = true
						groupMap[groupKey].pairs.push({
							key: left._id + '_' + right._id,
							comboKey: comboKey,
							leftName: left.displayName,
							leftMbti: left.mbti,
							rightName: right.displayName,
							rightMbti: right.mbti
						})
						total += 1
					}
				}

				var list = Object.keys(groupMap).map(function (key) {
					var group = groupMap[key]
					group.comboSummary = Object.keys(group.comboSet).join(' / ')
					delete group.comboSet
					return group
				})

				list.sort(function (a, b) {
					if (b.pairs.length !== a.pairs.length) {
						return b.pairs.length - a.pairs.length
					}
					return a.name.localeCompare(b.name)
				})

				return {
					totalPairs: total,
					groupList: list
				}
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
					var res = await db
						.collection('mbti-personnel')
						.field('person_id,nickname,name,mbti')
						.orderBy('person_id', 'asc')
						.get()
					var list = (res.result && res.result.data) || res.data || []
					var members = list
						.map(
							function (item) {
								var mbti = this.normalizeMbti(item.mbti)
								if (!mbti) {
									return null
								}
								return {
									_id: item._id,
									person_id: item.person_id,
									mbti: mbti,
									displayName: this.getDisplayName(item)
								}
							}.bind(this)
						)
						.filter(function (item) {
							return !!item
						})

					var result = this.buildPairGroups(members)
					this.totalMembers = list.length
					this.validMembers = members.length
					this.totalPairs = result.totalPairs
					this.groupList = result.groupList
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
		min-height: 100vh;
		padding: 24rpx;
		background: #f5efe5;
		box-sizing: border-box;
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
		flex-wrap: wrap;
		margin-top: 20rpx;
	}

	.stat-item {
		width: 50%;
		margin-bottom: 16rpx;
	}

	.stat-label {
		display: block;
		font-size: 22rpx;
		color: #8a7560;
	}

	.stat-value {
		display: block;
		margin-top: 6rpx;
		font-size: 36rpx;
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

	.group-list {
		margin-top: 20rpx;
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
</style>
