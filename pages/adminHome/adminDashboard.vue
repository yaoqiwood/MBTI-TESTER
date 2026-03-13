<template>
	<view class="page">
		<view class="panel-card">
			<view class="card-head">
				<text class="card-title">功能导航</text>
				<text class="card-tip">首页样式延续现有后台页面风格，先搭建入口层，具体模块逐步接入。</text>
			</view>

			<view class="feature-grid">
				<view
					v-for="(item, index) in featureList"
					:key="item.key"
					class="feature-card"
					@click="handleFeatureTap(item)"
				>
					<view class="feature-top">
						<text class="feature-tag">{{ formatModuleTag(index) }}</text>
						<text v-if="!item.available" class="feature-status is-pending">建设中</text>
					</view>
					<text class="feature-title">{{ item.title }}</text>
					<text class="feature-desc">{{ item.desc }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				featureList: [
					// {
					// 	key: 'mbti-question-bank',
					// 	title: 'MBTI题库管理',
					// 	desc: '维护 MBTI 题目、题型与题库内容，作为后续测评配置的统一入口。',
					// 	meta: '已接入现有后台页',
					// 	available: true,
					// 	url: '/pages/adminHome/personnelManagement'
					// },
					{
						key: 'game-query',
						title: '游戏查询管理',
						desc: '用于管理游戏查询条件、检索展示结果以及后续联动配置。',
						meta: '已接入二级页',
						available: true,
						url: '/pages/adminHome/gameQueryManagement'
					},
					{
						key: 'personnel',
						title: '人员管理',
						desc: '统一处理人员资料、账号关系、权限范围与业务归属信息。',
						meta: '预留功能位',
						available: true,
						url: '/pages/adminHome/personnelManagement'
					},
					{
						key: 'admin-user',
						title: '管理员管理',
						desc: '管理管理员账号、角色分配、登录控制和后台访问权限。',
						meta: '预留功能位',
						available: false
					}
				]
			}
		},
		methods: {
			formatModuleTag(index) {
				const moduleNo = index + 1
				return `MODULE ${moduleNo < 10 ? `0${moduleNo}` : moduleNo}`
			},
			handleFeatureTap(item) {
				if (item && item.available && item.url) {
					uni.navigateTo({
						url: item.url
					})
					return
				}
				this.showComingSoon()
			},
			showComingSoon() {
				uni.showToast({
					title: '功能建设中',
					icon: 'none'
				})
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

	.hero-card,
	.panel-card,
	.stat-card,
	.feature-card {
		background: #fffcf7;
		border: 1rpx solid #eadfce;
		border-radius: 28rpx;
		box-shadow: 0 18rpx 40rpx rgba(91, 70, 40, 0.08);
	}

	.hero-card,
	.panel-card {
		padding: 32rpx 28rpx;
	}

	.hero-copy,
	.card-head {
		display: flex;
		flex-direction: column;
	}

	.hero-kicker {
		font-size: 22rpx;
		letter-spacing: 4rpx;
		color: #8f6840;
	}

	.hero-title {
		margin-top: 16rpx;
		font-size: 44rpx;
		font-weight: 700;
		color: #2c241c;
		line-height: 1.24;
	}

	.hero-desc,
	.card-tip,
	.feature-desc {
		margin-top: 16rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #716250;
	}

	.hero-actions,
	.feature-foot,
	.feature-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	.hero-actions {
		margin-top: 24rpx;
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

	.stats-wrap {
		display: flex;
		flex-wrap: wrap;
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

	.panel-card {
		margin-top: 24rpx;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.feature-grid {
		margin-top: 24rpx;
	}

	.feature-card {
		padding: 28rpx 24rpx;
		margin-bottom: 20rpx;
	}

	.feature-top {
		justify-content: space-between;
	}

	.feature-tag,
	.feature-status {
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.feature-tag {
		background: #f3eadb;
		color: #7b6244;
	}

	.feature-status.is-ready {
		background: #dff4e8;
		color: #1e6b45;
	}

	.feature-status.is-pending {
		background: #fff1cc;
		color: #8e6400;
	}

	.feature-title {
		display: block;
		margin-top: 20rpx;
		font-size: 32rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.feature-foot {
		justify-content: space-between;
		margin-top: 24rpx;
	}

	.feature-meta {
		font-size: 22rpx;
		color: #8e7962;
	}

	.feature-link {
		font-size: 24rpx;
		font-weight: 600;
		color: #1f6b52;
	}
</style>
