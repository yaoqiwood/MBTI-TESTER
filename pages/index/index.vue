<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">正在为你进入首页</text>
				<text class="subhead">我们会先读取本地资料。</text>
			</view>

			<view class="loading-card">
				<view class="loading-orb"></view>
				<text class="loading-text">{{ loadingText }}</text>
			</view>
		</view>
	</view>
</template>

<script>
const PERSONNEL_PROFILE_STORAGE_KEY = 'mbtiPersonnelProfile'

export default {
	data() {
		return {
			loadingText: '读取本地身份信息中...'
		}
	},
	onLoad() {
		this.routeByCachedProfile()
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
		isAdminRole(adminRole) {
			const role = Number(adminRole)
			return role === 1 || role === 2 || role === 3
		},
		routeByCachedProfile() {
			const profile = this.getPersonnelProfileFromStorage()
			const targetUrl =
				profile && this.isAdminRole(profile.admin_role)
					? '/pages/adminHome/adminDashboard'
					: '/pages/mbti-home/home'

			this.loadingText =
				targetUrl === '/pages/adminHome/adminDashboard' ? '已识别为管理员，正在进入后台...' : '正在进入测试首页...'

			setTimeout(() => {
				uni.reLaunch({
					url: targetUrl
				})
			}, 120)
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
