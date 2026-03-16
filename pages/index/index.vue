<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">Opening your home</text>
				<text class="subhead">We are checking your login profile in the cloud.</text>
			</view>

			<view class="loading-card">
				<view class="loading-orb"></view>
				<text class="loading-text">{{ loadingText }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'

const PERSONNEL_PROFILE_STORAGE_KEY = 'mbtiPersonnelProfile'
const uniIdCo = uniCloud.importObject('uni-id-co', {
	customUI: true
})
const personnelAdmin = uniCloud.importObject('personnel-admin')

export default {
	data() {
		return {
			loadingText: 'Checking login status...'
		}
	},
	async onLoad() {
		await this.routeByLoginProfile()
	},
	methods: {
		getPersonnelProfileFromStorage() {
			try {
				const profile = uni.getStorageSync(PERSONNEL_PROFILE_STORAGE_KEY)
				return profile && typeof profile === 'object' ? profile : null
			} catch (error) {
				console.error('getPersonnelProfileFromStorage failed', error)
				return null
			}
		},
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
		clearPersonnelProfileStorage() {
			try {
				uni.removeStorageSync(PERSONNEL_PROFILE_STORAGE_KEY)
			} catch (error) {
				console.error('clearPersonnelProfileStorage failed', error)
			}
		},
		buildPersonnelProfilePayload(record = {}) {
			return {
				...record,
				id: record._id || '',
				personnel_id: record._id || '',
				person_id: typeof record.person_id !== 'undefined' ? record.person_id : '',
				admin_role: Number(record.admin_role) || 0,
				name: record.name || '',
				nickname: record.nickname || '',
				passcode: record.passcode || '',
				personal_photo: record.personal_photo || '',
				user_id: record.user_id || '',
				wx_openid: record.wx_openid || '',
				wx_unionid: record.wx_unionid || '',
				wx_nickname: record.wx_nickname || '',
				wx_avatar: record.wx_avatar || ''
			}
		},
		getCandidateOpenIds(user = {}) {
			const wxOpenid = user && user.wx_openid
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
		},
		getMergedCurrentUser() {
			try {
				const currentUserInfo = uniCloud.getCurrentUserInfo() || {}
				const currentUserInfoUser = currentUserInfo.userInfo || {}
				const cachedUser = uni.getStorageSync('uni-id-pages-userInfo') || {}
				return {
					...currentUserInfoUser,
					...cachedUser,
					_id: currentUserInfo.uid || cachedUser._id || '',
					wx_openid:
						cachedUser.wx_openid ||
						currentUserInfoUser.wx_openid ||
						currentUserInfo.wx_openid ||
						'',
					wx_unionid:
						cachedUser.wx_unionid ||
						currentUserInfoUser.wx_unionid ||
						currentUserInfo.wx_unionid ||
						''
				}
			} catch (error) {
				console.error('getMergedCurrentUser failed', error)
				return {}
			}
		},
		async fetchLoginOpenIdsFromServer(uid = '') {
			if (!uid) {
				return []
			}
			try {
				const result = await personnelAdmin.getCurrentLoginWxOpenid({
					uid
				})
				return (result && result.openIds) || []
			} catch (error) {
				console.error('fetchLoginOpenIdsFromServer failed', error)
				return []
			}
		},
		isAdminRole(adminRole) {
			const role = Number(adminRole)
			return role === 1 || role === 2 || role === 3
		},
		hasMbtiResult(record = {}) {
			return !!String(record.mbti || '')
				.trim()
				.toUpperCase()
		},
		async getProfileFromDatabase() {
			let openIds = []
			const currentUser = this.getMergedCurrentUser()
			const currentUserInfo = uniCloud.getCurrentUserInfo() || {}
			openIds = this.getCandidateOpenIds(currentUser)
			if (!openIds.length) {
				this.loadingText = 'Loading login profile...'
				openIds = await this.fetchLoginOpenIdsFromServer(currentUser._id || currentUserInfo.uid || '')
			}
			if (!openIds.length) {
				return null
			}

			for (let i = 0; i < openIds.length; i += 1) {
				const result = await personnelAdmin.getByWxOpenid({
					wxOpenid: openIds[i]
				})
				if (result && result.record && result.record._id) {
					return result.record
				}
			}
			return null
		},
		resolveTargetUrl(profile) {
			const targetUrl =
				profile && this.isAdminRole(profile.admin_role)
					? '/pages/adminHome/gameQueryManagement'
					: profile &&
						  Number(profile.admin_role) === 0 &&
						  this.hasMbtiResult(profile)
						? '/pages/userHeartMessage/userHeartMessage'
						: '/pages/mbti-home/home'
			return targetUrl
		},
		updateLoadingText(targetUrl) {
			if (targetUrl === '/pages/adminHome/gameQueryManagement') {
				this.loadingText = 'Admin detected, opening dashboard...'
			} else if (targetUrl === '/pages/userHeartMessage/userHeartMessage') {
				this.loadingText = 'User detected, opening contacts...'
			} else {
				this.loadingText = 'Opening MBTI home...'
			}
		},
		async routeByLoginProfile() {
			let profile = null

			// #ifdef MP-WEIXIN
			const loggedIn = await this.ensureWeixinLogin()
			if (!loggedIn) {
				this.clearPersonnelProfileStorage()
				this.updateLoadingText('/pages/mbti-home/home')
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/mbti-home/home'
					})
				}, 120)
				return
			}
			// #endif

			try {
				this.loadingText = 'Matching your profile in the database...'
				profile = await this.getProfileFromDatabase()
				if (profile && profile._id) {
					this.savePersonnelProfileToStorage(this.buildPersonnelProfilePayload(profile))
				} else {
					this.clearPersonnelProfileStorage()
				}
			} catch (error) {
				console.error('routeByLoginProfile failed', error)
				this.clearPersonnelProfileStorage()
				profile = null
			}

			const targetUrl = this.resolveTargetUrl(profile)
			this.updateLoadingText(targetUrl)

			setTimeout(() => {
				uni.reLaunch({
					url: targetUrl
				})
			}, 120)
		},
		// #ifdef MP-WEIXIN
		async ensureWeixinLogin() {
			const currentUserInfo = uniCloud.getCurrentUserInfo() || {}
			if (store.hasLogin && currentUserInfo.tokenExpired > Date.now()) {
				return true
			}

			uni.showLoading({
				title: '登录中',
				mask: true
			})

			try {
				const loginRes = await this.getWeixinCode()
				const result = await uniIdCo.loginByWeixin({
					code: loginRes.code
				})
				mutations.loginSuccess({
					...result,
					showToast: false,
					autoBack: false,
					loginType: 'weixin'
				})
				return true
			} catch (error) {
				console.error('ensureWeixinLogin failed', error)
				uni.showToast({
					title: (error && (error.errMsg || error.message)) || '微信登录失败',
					icon: 'none',
					duration: 3000
				})
				return false
			} finally {
				uni.hideLoading()
			}
		},
		getWeixinCode() {
			return new Promise((resolve, reject) => {
				uni.login({
					provider: 'weixin',
					onlyAuthorize: true,
					success: (res) => {
						if (res.code) {
							resolve(res)
							return
						}
						reject(new Error('未获取到微信登录凭证'))
					},
					fail: (error) => {
						reject(error)
					}
				})
			})
		}
		// #endif
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

.hero {
	position: relative;
	min-height: 100vh;
	padding: 56rpx 30rpx 48rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	justify-content: center;
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
.loading-card {
	position: relative;
	z-index: 2;
}

.eyebrow {
	display: block;
	font-size: 24rpx;
	letter-spacing: 6rpx;
	color: #8d5d41;
	margin-bottom: 16rpx;
	text-align: center;
}

.headline {
	display: block;
	font-size: 60rpx;
	line-height: 1.2;
	font-weight: 700;
	color: #2f211d;
	text-align: center;
}

.subhead {
	display: block;
	margin-top: 22rpx;
	font-size: 28rpx;
	line-height: 1.7;
	color: #6d5b56;
	text-align: center;
}

.loading-card {
	margin-top: 40rpx;
	padding: 42rpx 30rpx;
	border-radius: 36rpx;
	background: rgba(255, 255, 255, 0.78);
	box-shadow: 0 20rpx 44rpx rgba(117, 88, 63, 0.1);
	backdrop-filter: blur(10rpx);
	display: flex;
	flex-direction: column;
	align-items: center;
}

.loading-orb {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: linear-gradient(180deg, #2f2a47 0%, #594a83 100%);
	box-shadow: 0 18rpx 32rpx rgba(77, 62, 109, 0.22);
	animation: pulse 1.2s ease-in-out infinite;
}

.loading-text {
	margin-top: 24rpx;
	font-size: 28rpx;
	color: #4e3d37;
	font-weight: 600;
}

@keyframes pulse {
	0%,
	100% {
		transform: scale(0.95);
		opacity: 0.7;
	}

	50% {
		transform: scale(1);
		opacity: 1;
	}
}

@media screen and (max-width: 420px) {
	.headline {
		font-size: 54rpx;
	}
}
</style>
