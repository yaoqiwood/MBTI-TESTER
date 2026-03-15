<template>
	<view class="page">
		<view v-if="showProfilePopup" class="profile-mask" @click="closeProfilePopup">
			<view class="profile-dialog" @click.stop>
				<text class="profile-close" @click="closeProfilePopup">×</text>
				<text class="profile-title">请先完善资料</text>
				<text class="profile-desc">进入测试前，请填写昵称并上传头像。</text>

				<view class="profile-avatar-wrap">
					<!-- #ifdef MP-WEIXIN -->
					<button class="profile-avatar-trigger" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
						<image
							v-if="profileForm.avatar"
							class="profile-avatar"
							:src="profileForm.avatar"
							mode="aspectFill"
						></image>
						<view v-else class="profile-avatar profile-avatar-empty">
							<text>头像</text>
						</view>
					</button>
					<!-- #endif -->

					<!-- #ifndef MP-WEIXIN -->
					<view class="profile-avatar-trigger" @click="chooseAvatarImage">
						<image
							v-if="profileForm.avatar"
							class="profile-avatar"
							:src="profileForm.avatar"
							mode="aspectFill"
						></image>
						<view v-else class="profile-avatar profile-avatar-empty">
							<text>头像</text>
						</view>
					</view>
					<!-- #endif -->
				</view>

				<!-- #ifdef MP-WEIXIN -->
				<button class="profile-picker-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					选择微信头像
				</button>
				<!-- #endif -->

				<!-- #ifndef MP-WEIXIN -->
				<button class="profile-picker-btn" @click="chooseAvatarImage">选择头像</button>
				<!-- #endif -->

				<view class="profile-input-shell">
					<!-- #ifdef MP-WEIXIN -->
					<input
						v-model="profileForm.nickname"
						class="profile-input"
						type="nickname"
						placeholder="请输入昵称"
						confirm-type="done"
					/>
					<!-- #endif -->
					<!-- #ifndef MP-WEIXIN -->
					<input
						v-model="profileForm.nickname"
						class="profile-input"
						type="text"
						placeholder="请输入昵称"
						confirm-type="done"
					/>
					<!-- #endif -->
				</view>

				<button class="profile-confirm-btn" @click="confirmProfile">确认资料</button>
			</view>
		</view>

		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">信息确认</text>
				<text class="subhead">填写姓名与口令后提交。姓名支持输入搜索，若与候选名单不匹配会自动清空。</text>
			</view>

			<view class="form-card">
				<view class="field-block">
					<text class="field-label">姓名</text>
					<view class="input-shell" :class="{ active: showNameOptions }">
						<input
							v-model="nameInput"
							class="text-input"
							type="text"
							placeholder="输入姓名进行搜索"
							@focus="handleNameFocus"
							@input="handleNameInput"
							@blur="handleNameBlur"
							confirm-type="done"
						/>
					</view>
					<view v-if="showNameOptions && filteredNames.length" class="options-panel">
						<view
							v-for="item in filteredNames"
							:key="item._id"
							class="option-item"
							@touchstart="selectName(item)"
							@mousedown="selectName(item)"
						>
							<text>{{ item.name }}</text>
						</view>
					</view>
					<text v-else-if="showNameOptions && nameInput" class="empty-tip">没有匹配姓名，离开输入框后会自动清空</text>
				</view>

				<view class="field-block">
					<text class="field-label">口令</text>
					<view class="input-shell">
						<input
							v-model="password"
							class="text-input"
							type="text"
							password
							maxlength="4"
							@input="handlePasswordInput"
							placeholder="请输入口令"
							confirm-type="done"
						/>
					</view>
				</view>

				<view class="action-row">
					<view class="action-btn primary-btn" @click="submitForm">
						<text>确认</text>
					</view>
					<view class="action-btn ghost-btn" @click="goHome">
						<text>返回首页</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const usersTable = uniCloud.database().collection('uni-id-users')
const personnelAdmin = uniCloud.importObject('personnel-admin')
const PERSONNEL_PROFILE_STORAGE_KEY = 'mbtiPersonnelProfile'

export default {
	data() {
		return {
			nameOptions: [],
			nameInput: '',
			selectedName: '',
			selectedRecord: null,
			password: '',
			showNameOptions: false,
			showProfilePopup: true,
			saving: false,
			lastErrorMessage: '',
			lastErrorAt: 0,
			currentUser: null,
			profileForm: {
				nickname: '',
				avatar: ''
			}
		}
	},
	async onLoad() {
		await this.loadCurrentUser()
	},
	computed: {
		filteredNames() {
			return this.nameOptions
		}
	},
	methods: {
		savePersonnelProfileToStorage(payload) {
			try {
				uni.setStorageSync(PERSONNEL_PROFILE_STORAGE_KEY, {
					...payload,
					cached_at: Date.now()
				})
			} catch (error) {
				console.error('savePersonnelProfileToStorage failed', error)
			}
		},
		async loadCurrentUser() {
			try {
				const res = await usersTable
					.where('_id == $cloudEnv_uid')
					.field('_id,nickname,avatar_file,wx_openid,wx_unionid')
					.get()
				const user = (res.result && res.result.data && res.result.data[0]) || null
				this.currentUser = user
				if (!user) {
					return
				}
				this.profileForm.nickname = user.nickname || ''
				this.profileForm.avatar = (user.avatar_file && user.avatar_file.url) || user.avatar_file || ''
				this.showProfilePopup = !(this.profileForm.nickname && this.profileForm.avatar)
			} catch (error) {
				console.error(error)
			}
		},
		onChooseAvatar(event) {
			const avatarUrl = event && event.detail && event.detail.avatarUrl
			if (avatarUrl) {
				this.profileForm.avatar = avatarUrl
			}
		},
		chooseAvatarImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0]
					if (filePath) {
						this.profileForm.avatar = filePath
					}
				}
			})
		},
		confirmProfile() {
			if (!this.profileForm.nickname.trim()) {
				uni.showToast({
					title: '请输入昵称',
					icon: 'none'
				})
				return
			}
			if (!this.profileForm.avatar) {
				uni.showToast({
					title: '请上传头像',
					icon: 'none'
				})
				return
			}
			this.showProfilePopup = false
		},
		closeProfilePopup() {
			this.showProfilePopup = false
		},
		async searchNameOptions(keyword) {
			try {
				const res = await personnelAdmin.searchNames({
					keyword: keyword || '',
					limit: 5
				})
				this.nameOptions = (res && res.list) || []
			} catch (error) {
				this.nameOptions = []
			}
		},
		async uploadAvatarIfNeeded() {
			const avatar = this.profileForm.avatar
			if (!avatar) {
				return ''
			}
			if (/^(cloud|https?:)/.test(avatar)) {
				return avatar
			}
			const ext = avatar.split('.').pop() || 'jpg'
			const uploadRes = await uniCloud.uploadFile({
				filePath: avatar,
				cloudPath:
					'mbti-personnel/avatar-' +
					Date.now() +
					'-' +
					Math.random().toString(36).slice(2) +
					'.' +
					ext
			})
			this.profileForm.avatar = uploadRes.fileID
			return uploadRes.fileID
		},
		handleNameFocus() {
			this.showNameOptions = true
			this.searchNameOptions(this.nameInput.trim())
		},
		handleNameInput(event) {
			this.nameInput = event.detail.value
			this.selectedName = ''
			this.selectedRecord = null
			this.showNameOptions = true
			this.searchNameOptions(this.nameInput.trim())
		},
		handleNameBlur() {
			setTimeout(() => {
				const value = this.nameInput.trim()
				if (this.selectedName && this.selectedName === value) {
					this.nameInput = value
				} else if (!this.nameOptions.some((item) => item.name === value)) {
					this.nameInput = ''
					this.selectedName = ''
					this.selectedRecord = null
				} else {
					this.nameInput = value
					this.selectedName = value
					this.selectedRecord =
						this.nameOptions.find((item) => item.name === value) || this.selectedRecord
				}
				this.showNameOptions = false
				this.nameOptions = []
			}, 120)
		},
		selectName(item) {
			this.nameInput = item.name
			this.selectedName = item.name
			this.selectedRecord = item
			this.showNameOptions = false
			this.nameOptions = []
		},
		handlePasswordInput(event) {
			const value = ((event && event.detail && event.detail.value) || '')
				.replace(/\D/g, '')
				.slice(0, 4)
			this.password = value
		},
		showErrorModal(message) {
			const content = message || '保存失败'
			const now = Date.now()
			if (this.lastErrorMessage === content && now - this.lastErrorAt < 3000) {
				return
			}
			this.lastErrorMessage = content
			this.lastErrorAt = now
			uni.showModal({
				content: content,
				showCancel: false
			})
		},
		async submitForm() {
			if (this.showProfilePopup) {
				uni.showToast({
					title: '请先填写昵称和头像',
					icon: 'none'
				})
				return
			}

			const name = this.selectedName || this.nameInput.trim()
			const personnelId = this.selectedRecord && this.selectedRecord._id
			if (!this.selectedName || this.selectedName !== name || !personnelId) {
				this.nameInput = ''
				this.selectedName = ''
				this.selectedRecord = null
				uni.showToast({
					title: '请选择有效姓名',
					icon: 'none'
				})
				return
			}
			if (!this.password.trim()) {
				uni.showToast({
					title: '请输入口令',
					icon: 'none'
				})
				return
			}
			if (!/^\d{4}$/.test(this.password.trim())) {
				uni.showToast({
					title: '口令必须是4位数字',
					icon: 'none'
				})
				return
			}
			if (this.saving) {
				return
			}

			this.saving = true
			uni.showLoading({
				title: '保存中',
				mask: true
			})

			try {
				const uid = uniCloud.getCurrentUserInfo().uid
				if (!uid) {
					throw new Error('请先完成微信登录')
				}

				const avatarFileId = await this.uploadAvatarIfNeeded()
				const user = this.currentUser || {}
				const result = await personnelAdmin.upsertByUser({
					userId: uid,
					personnelId: personnelId,
					data: {
						nickname: this.profileForm.nickname.trim(),
						name: name,
						passcode: this.password.trim(),
						personal_photo: avatarFileId,
						user_id: uid,
						wx_openid: (user.wx_openid && user.wx_openid.mp) || '',
						wx_unionid: user.wx_unionid || '',
						wx_nickname: this.profileForm.nickname.trim(),
						wx_avatar: avatarFileId
					}
				})
				if (result && result.ok === false) {
					this.showErrorModal(result.message || '淇濆瓨澶辫触')
					return
				}

				this.savePersonnelProfileToStorage({
					id: result && result.id ? result.id : personnelId,
					personnel_id: personnelId,
					person_id: result && typeof result.person_id !== 'undefined' ? result.person_id : '',
					admin_role:
						result && typeof result.admin_role !== 'undefined'
							? Number(result.admin_role) || 0
							: Number(this.selectedRecord && this.selectedRecord.admin_role) || 0,
					name: name,
					nickname: this.profileForm.nickname.trim(),
					passcode: this.password.trim(),
					personal_photo: avatarFileId,
					user_id: uid,
					wx_openid: (user.wx_openid && user.wx_openid.mp) || '',
					wx_unionid: user.wx_unionid || '',
					wx_nickname: this.profileForm.nickname.trim(),
					wx_avatar: avatarFileId
				})
				uni.showToast({
					title: '提交成功',
					icon: 'success'
				})
				setTimeout(() => {
					uni.navigateTo({
						url: `/pages/test/test?name=${encodeURIComponent(name)}&personnelId=${encodeURIComponent(result.id)}`
					})
				}, 450)
			} catch (error) {
				this.showErrorModal((error && error.message) || '保存失败')
			} finally {
				this.saving = false
				uni.hideLoading()
			}
		},
		goHome() {
			uni.navigateTo({
				url: '/pages/mbti-home/home'
			})
		}
	}
}
</script>

<style>
	.page {
		min-height: 100vh;
		background:
			radial-gradient(circle at top left, rgba(255, 194, 159, 0.42), transparent 30%),
			radial-gradient(circle at top right, rgba(135, 202, 255, 0.4), transparent 24%),
			linear-gradient(180deg, #fffdf8 0%, #fff4ec 46%, #fffaf4 100%);
	}

	.profile-mask {
		position: fixed;
		inset: 0;
		z-index: 20;
		padding: 40rpx;
		background: rgba(36, 28, 24, 0.42);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-dialog {
		position: relative;
		width: 100%;
		max-width: 640rpx;
		padding: 38rpx 30rpx 34rpx;
		border-radius: 36rpx;
		background: linear-gradient(180deg, #fffdf9 0%, #fff5ed 100%);
		box-shadow: 0 28rpx 56rpx rgba(71, 50, 39, 0.18);
	}

	.profile-close {
		position: absolute;
		top: 18rpx;
		right: 24rpx;
		font-size: 40rpx;
		line-height: 1;
		color: #8b7168;
	}

	.profile-title {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: #2f211d;
		text-align: center;
	}

	.profile-desc {
		display: block;
		margin-top: 14rpx;
		font-size: 26rpx;
		line-height: 1.6;
		color: #715d56;
		text-align: center;
	}

	.profile-avatar-wrap {
		display: flex;
		justify-content: center;
		margin-top: 30rpx;
	}

	.profile-avatar-trigger {
		padding: 0;
		background: transparent;
		border: none;
		line-height: 1;
	}

	.profile-avatar-trigger::after {
		border: none;
	}

	.profile-avatar {
		width: 164rpx;
		height: 164rpx;
		border-radius: 50%;
		background: #f5e7db;
	}

	.profile-avatar-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9c7a6a;
		font-size: 26rpx;
		border: 2rpx dashed rgba(156, 122, 106, 0.35);
	}

	.profile-picker-btn,
	.profile-confirm-btn {
		margin-top: 24rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 999rpx;
		font-size: 28rpx;
		font-weight: 600;
		border: none;
	}

	.profile-picker-btn {
		background: rgba(255, 255, 255, 0.86);
		color: #4e3d37;
	}

	.profile-confirm-btn {
		background: linear-gradient(90deg, #2f2a47 0%, #594a83 100%);
		color: #fff9f0;
		box-shadow: 0 18rpx 32rpx rgba(77, 62, 109, 0.22);
	}

	.profile-picker-btn::after,
	.profile-confirm-btn::after {
		border: none;
	}

	.profile-input-shell {
		margin-top: 22rpx;
		padding: 0 28rpx;
		height: 94rpx;
		border-radius: 999rpx;
		border: 2rpx solid rgba(94, 68, 54, 0.1);
		background: rgba(255, 255, 255, 0.92);
		display: flex;
		align-items: center;
	}

	.profile-input {
		width: 100%;
		font-size: 28rpx;
		color: #342925;
	}

	.hero {
		position: relative;
		min-height: 100vh;
		padding: 56rpx 30rpx 48rpx;
		overflow: hidden;
	}

	.hero-backdrop {
		position: absolute;
		border-radius: 50%;
		filter: blur(10rpx);
		opacity: 0.55;
	}

	.hero-backdrop-left {
		width: 320rpx;
		height: 320rpx;
		left: -120rpx;
		top: -30rpx;
		background: linear-gradient(180deg, #ffd5bc 0%, #ffb58b 100%);
	}

	.hero-backdrop-right {
		width: 280rpx;
		height: 280rpx;
		right: -90rpx;
		top: 220rpx;
		background: linear-gradient(180deg, #cbe8ff 0%, #8ec8ff 100%);
	}

	.hero-copy,
	.form-card {
		position: relative;
		z-index: 2;
	}

	.eyebrow {
		display: block;
		font-size: 24rpx;
		letter-spacing: 6rpx;
		color: #8d5d41;
		margin-bottom: 16rpx;
	}

	.headline {
		display: block;
		font-size: 64rpx;
		line-height: 1.18;
		font-weight: 700;
		color: #2f211d;
	}

	.subhead {
		display: block;
		margin-top: 22rpx;
		font-size: 28rpx;
		line-height: 1.7;
		color: #6d5b56;
	}

	.form-card {
		margin-top: 42rpx;
		padding: 34rpx 28rpx;
		border-radius: 36rpx;
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 20rpx 44rpx rgba(117, 88, 63, 0.1);
		backdrop-filter: blur(10rpx);
	}

	.field-block {
		position: relative;
		margin-bottom: 28rpx;
	}

	.field-label {
		display: block;
		margin-bottom: 14rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #3f2d26;
	}

	.input-shell {
		padding: 0 28rpx;
		height: 94rpx;
		border-radius: 999rpx;
		border: 2rpx solid rgba(94, 68, 54, 0.1);
		background: rgba(255, 255, 255, 0.86);
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.input-shell.active {
		border-color: rgba(89, 74, 131, 0.28);
		box-shadow: 0 12rpx 28rpx rgba(89, 74, 131, 0.1);
	}

	.text-input {
		width: 100%;
		font-size: 28rpx;
		color: #342925;
	}

	.options-panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 12;
		margin-top: 16rpx;
		padding: 10rpx;
		border-radius: 28rpx;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 18rpx 32rpx rgba(87, 58, 37, 0.1);
	}

	.option-item {
		padding: 20rpx 22rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #4e3d37;
	}

	.option-item + .option-item {
		margin-top: 8rpx;
	}

	.empty-tip {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 12;
		display: block;
		margin-top: 16rpx;
		padding: 18rpx 8rpx 0;
		font-size: 24rpx;
		color: #9c7a6a;
	}

	.action-row {
		display: flex;
		gap: 16rpx;
		margin-top: 26rpx;
		min-height: 120rpx;
		align-items: stretch;
	}

	.action-btn {
		flex: 1;
		min-height: 80rpx;
		padding: 0 24rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.action-btn text {
		font-size: 34rpx;
		font-weight: 600;
		line-height: 1;
	}

	.primary-btn {
		background: linear-gradient(90deg, #2f2a47 0%, #594a83 100%);
		color: #fff9f0;
		box-shadow: 0 18rpx 32rpx rgba(77, 62, 109, 0.22);
	}

	.ghost-btn {
		background: rgba(255, 255, 255, 0.68);
		color: #4e3d37;
		border: 2rpx solid rgba(94, 68, 54, 0.12);
	}

	@media screen and (max-width: 420px) {
		.headline {
			font-size: 56rpx;
		}

		.action-row {
			flex-direction: column;
		}
	}
</style>
