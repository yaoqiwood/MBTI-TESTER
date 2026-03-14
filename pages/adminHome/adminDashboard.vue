<template>
	<view class="page">
		<view class="toolbar">
			<button class="back-btn" @click="goBack">返回上一页</button>
		</view>

		<view class="panel-card admin-card">
			<view class="card-head">
				<text class="card-title">管理员管理</text>
				<text class="card-tip">默认只显示管理员与超级管理员；超级管理员不可变更，普通管理员可降级为普通测试者。</text>
			</view>

			<view class="stats-wrap">
				<view class="stat-card">
					<text class="stat-label">管理员总数</text>
					<text class="stat-value">{{ adminStats.total }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">普通管理员</text>
					<text class="stat-value">{{ adminStats.admins }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">超级管理员</text>
					<text class="stat-value">{{ adminStats.superAdmins }}</text>
				</view>
				<view class="stat-card">
					<text class="stat-label">候选人数</text>
					<text class="stat-value">{{ candidateList.length }}</text>
				</view>
			</view>

			<view class="toolbar-row">
				<input
					v-model.trim="adminKeyword"
					class="search-input"
					placeholder="搜索编号 / 昵称 / 姓名 / 手机 / MBTI"
					confirm-type="search"
					@confirm="loadAdminList"
				/>
				<view class="toolbar-actions">
					<button class="light-btn" @click="loadAdminList">刷新</button>
					<button class="solid-btn" @click="toggleAddPanel">新增管理员</button>
				</view>
			</view>

			<view v-if="showAddPanel" class="candidate-panel">
				<view class="candidate-head">
					<text class="section-title">选择人员加入管理员</text>
					<button class="ghost-btn mini-ghost-btn" @click="toggleAddPanel">收起</button>
				</view>
				<input
					v-model.trim="candidateKeyword"
					class="search-input"
					placeholder="搜索普通测试者并提升为管理员"
					confirm-type="search"
					@confirm="loadCandidateList"
				/>
				<view class="candidate-toolbar">
					<button class="light-btn" @click="loadCandidateList">查询候选人</button>
					<button class="ghost-btn" @click="goPersonnelManagement">去人员管理</button>
				</view>
				<view v-if="candidateLoading" class="empty-box">
					<text>正在加载候选人员...</text>
				</view>
				<view v-else-if="!candidateList.length" class="empty-box">
					<text>暂无可提升的普通测试者</text>
				</view>
				<view v-else class="candidate-list">
					<view v-for="item in candidateList" :key="item._id" class="candidate-item">
						<view class="candidate-main">
							<text class="candidate-name">#{{ item.person_id }} · {{ item.nickname || '-' }} / {{ item.name || '-' }}</text>
							<text class="candidate-meta">手机：{{ item.mobile || '-' }}　MBTI：{{ item.mbti || '-' }}</text>
						</view>
						<button class="mini-btn" :disabled="actionLoading" @click="promoteToAdmin(item)">设为管理员</button>
					</view>
				</view>
			</view>

			<scroll-view scroll-x class="table-scroll">
				<view class="table">
					<view class="table-row table-header">
						<text class="col col-id">编号</text>
						<text class="col col-name">昵称 / 姓名</text>
						<text class="col col-mobile">手机号</text>
						<text class="col col-mbti">MBTI</text>
						<text class="col col-role">管理员级别</text>
						<text class="col col-status">审核状态</text>
						<text class="col col-time">更新时间</text>
						<text class="col col-action">操作</text>
					</view>
					<view v-if="loading" class="empty-box">
						<text>正在加载管理员数据...</text>
					</view>
					<view v-else-if="!adminList.length" class="empty-box">
						<text>当前没有管理员数据</text>
					</view>
					<view v-for="item in adminList" :key="item._id" class="table-row body-row">
						<text class="col col-id">#{{ item.person_id || '-' }}</text>
						<view class="col col-name name-cell">
							<text class="primary-text">{{ item.nickname || '-' }}</text>
							<text class="secondary-text">{{ item.name || '-' }}</text>
						</view>
						<text class="col col-mobile">{{ item.mobile || '-' }}</text>
						<text class="col col-mbti">{{ item.mbti || '-' }}</text>
						<view class="col col-role">
							<text class="role-pill" :class="roleClass(item.admin_role)">{{ adminRoleText(item.admin_role) }}</text>
						</view>
						<text class="col col-status">{{ reviewStatusText(item.review_status) }}</text>
						<text class="col col-time">{{ formatDate(item.updated_at || item.updated_at_text) }}</text>
						<view class="col col-action action-cell">
							<button v-if="Number(item.admin_role) === 1" class="mini-btn danger-btn" :disabled="actionLoading" @click="demoteAdmin(item)">降级为普通</button>
							<text v-else class="fixed-tip">超级管理员不可变更</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	let personnelAdmin = null

	try {
		personnelAdmin = uniCloud.importObject('personnel-admin')
	} catch (error) {
		console.error('import personnel-admin failed', error)
	}

	export default {
		data() {
			return {
				loading: false,
				actionLoading: false,
				candidateLoading: false,
				showAddPanel: false,
				adminKeyword: '',
				candidateKeyword: '',
				adminList: [],
				candidateList: [],
				adminStats: {
					total: 0,
					admins: 0,
					superAdmins: 0
				}
			}
		},
		onLoad() {
			this.loadAdminList()
		},
		methods: {
			goBack() {
				const pageStack = getCurrentPages()
				if (pageStack.length > 1) {
					uni.navigateBack({ delta: 1 })
					return
				}
				uni.reLaunch({ url: '/pages/adminHome/gameQueryManagement' })
			},
			async loadAdminList() {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				this.loading = true
				try {
					const res = await personnelAdmin.listAdmins({ keyword: this.adminKeyword })
					this.adminList = Array.isArray(res && res.list) ? res.list : []
					this.adminStats = {
						total: Number(res && res.stats && res.stats.total) || 0,
						admins: Number(res && res.stats && res.stats.admins) || 0,
						superAdmins: Number(res && res.stats && res.stats.superAdmins) || 0
					}
				} catch (error) {
					console.error('loadAdminList failed', error)
					uni.showToast({
						title: error.message || '管理员加载失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},
			async loadCandidateList() {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				this.candidateLoading = true
				try {
					const res = await personnelAdmin.listAdminCandidates({ keyword: this.candidateKeyword })
					this.candidateList = Array.isArray(res && res.list) ? res.list : []
				} catch (error) {
					console.error('loadCandidateList failed', error)
					uni.showToast({
						title: error.message || '候选人加载失败',
						icon: 'none'
					})
				} finally {
					this.candidateLoading = false
				}
			},
			toggleAddPanel(forceOpen) {
				const nextVisible = typeof forceOpen === 'boolean' ? forceOpen : !this.showAddPanel
				this.showAddPanel = nextVisible
				if (nextVisible) {
					this.loadCandidateList()
				}
			},
			async promoteToAdmin(item) {
				if (!item || !item._id || this.actionLoading || !personnelAdmin) {
					return
				}
				this.actionLoading = true
				try {
					await personnelAdmin.updateAdminRole({ id: item._id, adminRole: 1 })
					uni.showToast({ title: '已设为管理员', icon: 'success' })
					await Promise.all([this.loadAdminList(), this.loadCandidateList()])
				} catch (error) {
					console.error('promoteToAdmin failed', error)
					uni.showToast({
						title: error.message || '设置失败',
						icon: 'none'
					})
				} finally {
					this.actionLoading = false
				}
			},
			demoteAdmin(item) {
				if (!item || !item._id || Number(item.admin_role) !== 1 || this.actionLoading || !personnelAdmin) {
					return
				}
				uni.showModal({
					title: '确认降级',
					content: `确认将 ${item.nickname || item.name || '该管理员'} 降级为普通测试者吗？`,
					success: async (res) => {
						if (!res.confirm) {
							return
						}
						this.actionLoading = true
						try {
							await personnelAdmin.updateAdminRole({ id: item._id, adminRole: 0 })
							uni.showToast({ title: '已降级为普通', icon: 'success' })
							await Promise.all([this.loadAdminList(), this.loadCandidateList()])
						} catch (error) {
							console.error('demoteAdmin failed', error)
							uni.showToast({
								title: error.message || '降级失败',
								icon: 'none'
							})
						} finally {
							this.actionLoading = false
						}
					}
				})
			},
			adminRoleText(role) {
				const value = Number(role)
				if (value === 2) {
					return '超级管理员'
				}
				if (value === 1) {
					return '管理员'
				}
				return '普通测试者'
			},
			roleClass(role) {
				const value = Number(role)
				if (value === 2) {
					return 'role-super'
				}
				if (value === 1) {
					return 'role-admin'
				}
				return 'role-normal'
			},
			reviewStatusText(status) {
				if (status === 'approved') {
					return '已通过'
				}
				if (status === 'rejected') {
					return '已驳回'
				}
				return '待审核'
			},
			formatDate(value) {
				if (!value) {
					return '-'
				}
				const date = new Date(value)
				if (Number.isNaN(date.getTime())) {
					return typeof value === 'string' ? value.replace('T', ' ').slice(0, 19) : '-'
				}
				const year = date.getFullYear()
				const month = `${date.getMonth() + 1}`.padStart(2, '0')
				const day = `${date.getDate()}`.padStart(2, '0')
				const hours = `${date.getHours()}`.padStart(2, '0')
				const minutes = `${date.getMinutes()}`.padStart(2, '0')
				return `${year}-${month}-${day} ${hours}:${minutes}`
			},
			goPersonnelManagement() {
				uni.navigateTo({ url: '/pages/adminHome/personnelManagement' })
			},
			showUnavailable() {
				uni.showToast({ title: '云对象不可用', icon: 'none' })
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
		margin-bottom: 20rpx;
	}

	.back-btn {
		height: 68rpx;
		line-height: 68rpx;
		padding: 0 28rpx;
		border-radius: 999rpx;
		font-size: 24rpx;
		color: #6d4e2c;
		background: #efe5d3;
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
	}

	.card-head {
		display: flex;
		flex-direction: column;
	}

	.card-title,
	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.card-tip,
	.fixed-tip,
	.secondary-text,
	.candidate-meta {
		margin-top: 16rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #716250;
	}

	.toolbar-row,
	.toolbar-actions,
	.candidate-head,
	.candidate-toolbar,
	.stats-wrap,
	.action-cell {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	.candidate-head {
		justify-content: space-between;
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

	.toolbar-row {
		margin-top: 8rpx;
		align-items: flex-start;
	}

	.toolbar-actions,
	.candidate-toolbar {
		justify-content: flex-end;
		margin-top: 20rpx;
	}

	.search-input {
		width: 100%;
		height: 84rpx;
		padding: 0 24rpx;
		line-height: 84rpx;
		background: #fbf8f2;
		border: 1rpx solid #dfd3c1;
		border-radius: 20rpx;
		box-sizing: border-box;
		color: #342b22;
		font-size: 26rpx;
	}

	.candidate-panel {
		margin-top: 24rpx;
		padding: 24rpx;
		border-radius: 24rpx;
		background: #fffaf3;
		border: 1rpx solid #eadfce;
	}

	.candidate-list {
		margin-top: 20rpx;
	}

	.candidate-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eadfce;
		gap: 20rpx;
	}

	.candidate-item:last-child {
		border-bottom: none;
	}

	.candidate-main {
		flex: 1;
		min-width: 0;
	}

	.candidate-name,
	.primary-text {
		display: block;
		margin-top: 20rpx;
		font-size: 30rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.table-scroll {
		width: 100%;
		margin-top: 24rpx;
	}

	.table {
		min-width: 1280rpx;
	}

	.table-row {
		display: flex;
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
	}

	.col-id { width: 120rpx; }
	.col-name { width: 240rpx; }
	.col-mobile { width: 220rpx; }
	.col-mbti { width: 120rpx; }
	.col-role { width: 190rpx; }
	.col-status { width: 150rpx; }
	.col-time { width: 220rpx; }
	.col-action { width: 220rpx; }

	.name-cell,
	.action-cell {
		flex-direction: column;
		justify-content: center;
	}

	.role-pill {
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.role-admin {
		background: #dff4e8;
		color: #1e6b45;
	}

	.role-super {
		background: #fce3ad;
		color: #7a4a12;
	}

	.role-normal {
		background: #efe5d3;
		color: #6d4e2c;
	}

	.empty-box {
		padding: 44rpx 24rpx;
		font-size: 26rpx;
		color: #857362;
		text-align: center;
	}

	.solid-btn,
	.ghost-btn,
	.light-btn,
	.mini-btn {
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

	.light-btn {
		background: #f7f1e6;
		color: #5b4a35;
	}

	.mini-btn {
		height: 60rpx;
		line-height: 60rpx;
		padding: 0 20rpx;
		font-size: 24rpx;
		background: #f3eadb;
		color: #5e472e;
		margin-right: 0;
	}

	.mini-ghost-btn {
		height: 60rpx;
		line-height: 60rpx;
		font-size: 24rpx;
		padding: 0 20rpx;
		margin-right: 0;
	}

	.danger-btn {
		background: #fde8e6;
		color: #b5483f;
	}
</style>
