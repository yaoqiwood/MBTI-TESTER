<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">用一场浪漫的性格漫游，找到你爱的表达方式</text>
				<text class="subhead">这是一张没有题目的首页。先感受 12 种人格形象，再进入原测试页开始作答。</text>
			</view>

			<view class="hero-stage">
				<view class="center-orb">
					<text class="orb-text">MBTI</text>
				</view>
				<view
					v-for="(item, index) in orbitTypes"
					:key="item.code"
					class="orbit-chip"
					:style="orbitStyle(index)"
				>
					<text class="orbit-chip-code">{{ item.code }}</text>
				</view>
			</view>

			<view class="hero-actions">
				<view class="hero-action-btn primary-btn" @click="goTest">
					<text>进入测试</text>
				</view>
				<view class="hero-action-btn ghost-btn" @click="scrollToGallery">
					<text>先看人格形象</text>
				</view>
			</view>
		</view>

		<view class="summary-panel">
			<view class="summary-card">
				<text class="summary-label">风格关键词</text>
				<text class="summary-value">直觉 / 热烈 / 共鸣 / 探索</text>
			</view>
			<view class="summary-card">
				<text class="summary-label">适合场景</text>
				<text class="summary-value">恋爱配对、自我认知、朋友破冰</text>
			</view>
		</view>

		<view class="gallery" id="gallery">
			<view class="section-head">
				<text class="section-kicker">12 PERSONAS</text>
				<text class="section-title">十二种人格形象</text>
				<text class="section-desc">不是题目列表，而是你的第一眼印象墙。每一张卡片，先告诉你一种气质。</text>
			</view>

			<view class="card-grid">
				<view
					v-for="item in personas"
					:key="item.code"
					class="persona-card"
					:style="{ background: item.cardBg }"
				>
					<view class="persona-top">
						<view
							class="avatar-shell"
							:style="{
								background: item.avatarPanelBg
							}"
						>
							<view
								class="avatar-aura"
								:style="{
									background: item.avatarAura
								}"
							></view>
							<view class="avatar-figure">
								<view
									class="avatar-head"
									:style="{
										background: item.avatarHead
									}"
								></view>
								<view
									class="avatar-body"
									:style="{
										background: item.avatarBody
									}"
								></view>
							</view>
							<text class="avatar-caption">{{ item.avatarTitle }}</text>
						</view>
						<view class="persona-badge" :style="{ background: item.badgeBg }">
							<text class="persona-code">{{ item.code }}</text>
						</view>
					</view>
					<text class="persona-name">{{ item.name }}</text>
					<text class="persona-tag">{{ item.tagline }}</text>
					<text class="persona-note">{{ item.note }}</text>
				</view>
			</view>
		</view>

		<view class="footer-cta">
			<text class="footer-title">准备好了就开始</text>
			<text class="footer-text">原测试页已经保留，当前先通过按钮切换过去。</text>
			<button class="primary-btn wide-btn" @click="goTest">前往原测试页</button>
		</view>
	</view>
</template>

<script>
const personas = [
	{
		code: 'INFP',
		name: '月光理想家',
		tagline: '温柔、想象力、情绪共鸣',
		note: '擅长在关系里创造细腻氛围，喜欢被真正理解。',
		cardBg: 'linear-gradient(160deg, #fff6f0 0%, #ffd7c2 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,238,229,0.72) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(255, 198, 170, 0.95) 0%, rgba(255, 198, 170, 0) 62%)',
		avatarHead: '#f3cfbe',
		avatarBody: 'linear-gradient(180deg, #b96d74 0%, #8f4d32 100%)',
		avatarTitle: '治愈系',
		accent: '#8f4d32',
		badgeBg: '#fff2e8'
	},
	{
		code: 'ENFP',
		name: '烟火冒险家',
		tagline: '热情、灵感、即时心动',
		note: '能把一场普通对话，点燃成让人记很久的夜晚。',
		cardBg: 'linear-gradient(160deg, #fff9e8 0%, #ffe29f 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,244,208,0.78) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(255, 197, 74, 0.92) 0%, rgba(255, 197, 74, 0) 62%)',
		avatarHead: '#f4cebc',
		avatarBody: 'linear-gradient(180deg, #ffb347 0%, #d97a00 100%)',
		avatarTitle: '冒险派',
		accent: '#8d5a00',
		badgeBg: '#fff6cf'
	},
	{
		code: 'INFJ',
		name: '静谧预言家',
		tagline: '洞察、克制、深度连接',
		note: '表面平静，内心却早已看见关系的未来轨迹。',
		cardBg: 'linear-gradient(160deg, #eef7ff 0%, #c9e7ff 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(223,241,255,0.78) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(95, 170, 235, 0.9) 0%, rgba(95, 170, 235, 0) 62%)',
		avatarHead: '#efd2c4',
		avatarBody: 'linear-gradient(180deg, #5d8ec7 0%, #1f5d96 100%)',
		avatarTitle: '洞察者',
		accent: '#1f5d96',
		badgeBg: '#e8f5ff'
	},
	{
		code: 'ENFJ',
		name: '暖场指挥家',
		tagline: '感染力、包容、带领感',
		note: '习惯照顾所有人的感受，也最懂得怎样让爱落地。',
		cardBg: 'linear-gradient(160deg, #f5efff 0%, #dcc8ff 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(235,224,255,0.8) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(150, 112, 228, 0.9) 0%, rgba(150, 112, 228, 0) 62%)',
		avatarHead: '#f1d0c0',
		avatarBody: 'linear-gradient(180deg, #8f6ae4 0%, #5b36ae 100%)',
		avatarTitle: '引导者',
		accent: '#5b36ae',
		badgeBg: '#f1eaff'
	},
	{
		code: 'INTP',
		name: '星图分析师',
		tagline: '理性、好奇、反差魅力',
		note: '不轻易开口，但一旦认真回应，句句都很有分量。',
		cardBg: 'linear-gradient(160deg, #edfdf6 0%, #c4f2dd 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(220,247,234,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(77, 188, 143, 0.9) 0%, rgba(77, 188, 143, 0) 62%)',
		avatarHead: '#efd3c4',
		avatarBody: 'linear-gradient(180deg, #4daf8c 0%, #1e6a4a 100%)',
		avatarTitle: '思辨派',
		accent: '#1e6a4a',
		badgeBg: '#e8fbf2'
	},
	{
		code: 'ENTP',
		name: '灵感煽动者',
		tagline: '机敏、跳跃、玩心十足',
		note: '擅长让关系保持新鲜感，总能提出意想不到的可能。',
		cardBg: 'linear-gradient(160deg, #fff3f7 0%, #ffc7d8 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,230,238,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(255, 122, 165, 0.9) 0%, rgba(255, 122, 165, 0) 62%)',
		avatarHead: '#f2d2c3',
		avatarBody: 'linear-gradient(180deg, #db5a88 0%, #9a2f54 100%)',
		avatarTitle: '点子王',
		accent: '#9a2f54',
		badgeBg: '#ffe9f0'
	},
	{
		code: 'ISFP',
		name: '雾色艺术家',
		tagline: '感受力、审美、慢热真心',
		note: '不爱喧闹，却会用细节、眼神和陪伴表达偏爱。',
		cardBg: 'linear-gradient(160deg, #f7f4ef 0%, #ead7c1 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(243,233,221,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(182, 145, 101, 0.85) 0%, rgba(182, 145, 101, 0) 62%)',
		avatarHead: '#efd4c7',
		avatarBody: 'linear-gradient(180deg, #ac8b63 0%, #7a5528 100%)',
		avatarTitle: '审美派',
		accent: '#7a5528',
		badgeBg: '#f9f0e5'
	},
	{
		code: 'ESFP',
		name: '心动现场派',
		tagline: '活力、亲近、即时反馈',
		note: '喜欢把喜欢说出来，也擅长把快乐分享给身边的人。',
		cardBg: 'linear-gradient(160deg, #f2fff6 0%, #c8f7d4 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(225,255,233,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(99, 211, 122, 0.9) 0%, rgba(99, 211, 122, 0) 62%)',
		avatarHead: '#f0d1c0',
		avatarBody: 'linear-gradient(180deg, #58bf70 0%, #1f6b33 100%)',
		avatarTitle: '气氛组',
		accent: '#1f6b33',
		badgeBg: '#e9ffef'
	},
	{
		code: 'ISTJ',
		name: '秩序守护者',
		tagline: '稳定、可靠、慢慢兑现',
		note: '爱不是惊天动地，而是把答应过的事一件件做到。',
		cardBg: 'linear-gradient(160deg, #f3f5f8 0%, #d6dde8 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(232,237,244,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(115, 136, 164, 0.88) 0%, rgba(115, 136, 164, 0) 62%)',
		avatarHead: '#ecd2c5',
		avatarBody: 'linear-gradient(180deg, #70839d 0%, #44556f 100%)',
		avatarTitle: '稳稳型',
		accent: '#44556f',
		badgeBg: '#eef2f7'
	},
	{
		code: 'ESTJ',
		name: '行动主理人',
		tagline: '直接、果断、掌控节奏',
		note: '擅长推动关系向前，安全感来自明确和执行。',
		cardBg: 'linear-gradient(160deg, #fff4ec 0%, #ffd3b3 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,233,216,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(232, 145, 86, 0.88) 0%, rgba(232, 145, 86, 0) 62%)',
		avatarHead: '#f1d2c0',
		avatarBody: 'linear-gradient(180deg, #cc7d45 0%, #8b451e 100%)',
		avatarTitle: '行动派',
		accent: '#8b451e',
		badgeBg: '#fff0e4'
	},
	{
		code: 'INTJ',
		name: '冷焰策划者',
		tagline: '远见、边界、极致认真',
		note: '看起来克制，真正喜欢时会拿出少见的投入和专注。',
		cardBg: 'linear-gradient(160deg, #eef1ff 0%, #c9d2ff 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(228,233,255,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(106, 127, 232, 0.9) 0%, rgba(106, 127, 232, 0) 62%)',
		avatarHead: '#ecd0c0',
		avatarBody: 'linear-gradient(180deg, #6578d8 0%, #3343a2 100%)',
		avatarTitle: '规划者',
		accent: '#3343a2',
		badgeBg: '#ebeeff'
	},
	{
		code: 'ESFJ',
		name: '甜度组织者',
		tagline: '关怀、体贴、关系维护',
		note: '天然会照顾气氛，也会用很多小仪式认真经营感情。',
		cardBg: 'linear-gradient(160deg, #fff8f3 0%, #ffe3d1 100%)',
		avatarPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,240,229,0.82) 100%)',
		avatarAura: 'radial-gradient(circle at 50% 28%, rgba(242, 164, 120, 0.88) 0%, rgba(242, 164, 120, 0) 62%)',
		avatarHead: '#f0d1bf',
		avatarBody: 'linear-gradient(180deg, #d99063 0%, #9a5736 100%)',
		avatarTitle: '照顾型',
		accent: '#9a5736',
		badgeBg: '#fff1e8'
	}
]

export default {
	data() {
		return {
			personas
		}
	},
	computed: {
		orbitTypes() {
			return this.personas.slice(0, 12)
		}
	},
	methods: {
		goTest() {
			this.navigateToTest()
		},
		navigateToTest() {
			uni.navigateTo({
				url: '/pages/user/helper'
			})
		},
		// #ifdef MP-WEIXIN
		async ensureWeixinLogin() {
			if (this.hasLogin && uniCloud.getCurrentUserInfo().tokenExpired > Date.now()) {
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
				uni.showToast({
					title: '微信登录成功',
					icon: 'none'
				})
				return true
			} catch (error) {
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
		},
		// #endif
		scrollToGallery() {
			const query = uni.createSelectorQuery().in(this)
			query.select('#gallery').boundingClientRect()
			query.selectViewport().scrollOffset()
			query.exec((res) => {
				const galleryRect = res && res[0]
				const viewport = res && res[1]
				if (!galleryRect || !viewport) {
					uni.showToast({
						title: '请向下滑动查看人格形象',
						icon: 'none'
					})
					return
				}

				uni.pageScrollTo({
					scrollTop: galleryRect.top + viewport.scrollTop - 24,
					duration: 300
				})
			})
		},
		orbitStyle(index) {
			const positions = [
				{ top: '10rpx', left: '180rpx' },
				{ top: '70rpx', right: '30rpx' },
				{ top: '220rpx', right: '0rpx' },
				{ top: '360rpx', right: '70rpx' },
				{ top: '430rpx', left: '190rpx' },
				{ top: '360rpx', left: '40rpx' },
				{ top: '230rpx', left: '-10rpx' },
				{ top: '80rpx', left: '40rpx' },
				{ top: '30rpx', left: '320rpx' },
				{ top: '150rpx', right: '-10rpx' },
				{ top: '300rpx', left: '-20rpx' },
				{ top: '430rpx', right: '130rpx' }
			]
			return positions[index] || {}
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
	padding: 56rpx 30rpx 36rpx;
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
	top: 180rpx;
	background: linear-gradient(180deg, #cbe8ff 0%, #8ec8ff 100%);
}

.hero-copy,
.hero-stage,
.hero-actions,
.summary-panel,
.gallery,
.footer-cta {
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

.hero-stage {
	position: relative;
	width: 520rpx;
	height: 520rpx;
	margin: 42rpx auto 30rpx;
	border-radius: 50%;
	border: 2rpx dashed rgba(111, 82, 66, 0.16);
}

.center-orb {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 180rpx;
	height: 180rpx;
	margin-left: -90rpx;
	margin-top: -90rpx;
	border-radius: 50%;
	background: linear-gradient(180deg, #2f2a47 0%, #4b4266 100%);
	box-shadow: 0 24rpx 54rpx rgba(69, 56, 95, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
}

.orb-text {
	color: #fff6ec;
	font-size: 42rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
}

.orbit-chip {
	position: absolute;
	min-width: 108rpx;
	padding: 14rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.76);
	backdrop-filter: blur(8rpx);
	box-shadow: 0 12rpx 24rpx rgba(87, 58, 37, 0.08);
	text-align: center;
}

.orbit-chip-code {
	font-size: 24rpx;
	font-weight: 700;
	color: #614536;
}

.hero-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.hero-action-btn {
	flex: 1;
	height: 92rpx;
	border-radius: 999rpx;
	font-size: 30rpx;
	font-weight: 600;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
}

.primary-btn,
.ghost-btn {
	box-sizing: border-box;
}

.hero-action-btn text {
	font-size: 30rpx;
	font-weight: 600;
	line-height: 1;
}

.primary-btn {
	position: relative;
	top: 5rpx;
	background: linear-gradient(90deg, #2f2a47 0%, #594a83 100%);
	color: #fff9f0;
	box-shadow: 0 18rpx 32rpx rgba(77, 62, 109, 0.22);
}

.primary-btn::after,
.ghost-btn::after,
.wide-btn::after {
	border: none;
}

.ghost-btn {
	background: rgba(255, 255, 255, 0.68);
	color: #4e3d37;
	border: 2rpx solid rgba(94, 68, 54, 0.12);
}

.summary-panel {
	display: flex;
	padding: 0 30rpx;
	margin-bottom: 34rpx;
	justify-content: space-between;
}

.summary-card {
	width: 336rpx;
	padding: 24rpx;
	border-radius: 28rpx;
	background: rgba(255, 255, 255, 0.72);
	box-shadow: 0 16rpx 34rpx rgba(117, 88, 63, 0.08);
}

.summary-label {
	display: block;
	font-size: 22rpx;
	color: #8f776d;
	margin-bottom: 10rpx;
}

.summary-value {
	display: block;
	font-size: 28rpx;
	line-height: 1.5;
	color: #342925;
	font-weight: 600;
}

.gallery {
	padding: 14rpx 30rpx 10rpx;
}

.section-head {
	margin-bottom: 24rpx;
}

.section-kicker {
	display: block;
	font-size: 22rpx;
	letter-spacing: 4rpx;
	color: #8e6a53;
	margin-bottom: 12rpx;
}

.section-title {
	display: block;
	font-size: 46rpx;
	font-weight: 700;
	color: #2f231f;
}

.section-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 28rpx;
	line-height: 1.7;
	color: #6f615c;
}

.card-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.persona-card {
	width: 332rpx;
	padding: 22rpx;
	margin-bottom: 20rpx;
	border-radius: 32rpx;
	min-height: 340rpx;
	box-shadow: 0 18rpx 32rpx rgba(117, 88, 63, 0.1);
}

.persona-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 18rpx;
}

.avatar-shell {
	position: relative;
	width: 132rpx;
	height: 148rpx;
	border-radius: 28rpx;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.56);
	box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.35);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-aura {
	position: absolute;
	left: 50%;
	top: 14rpx;
	width: 110rpx;
	height: 110rpx;
	margin-left: -55rpx;
	border-radius: 50%;
}

.avatar-figure {
	position: absolute;
	left: 50%;
	bottom: 22rpx;
	width: 92rpx;
	height: 100rpx;
	margin-left: -46rpx;
}

.avatar-head {
	width: 42rpx;
	height: 42rpx;
	margin: 0 auto;
	border-radius: 50%;
	box-shadow: 0 6rpx 10rpx rgba(93, 64, 55, 0.1);
}

.avatar-body {
	width: 72rpx;
	height: 48rpx;
	margin: 8rpx auto 0;
	border-radius: 28rpx 28rpx 18rpx 18rpx;
	box-shadow: 0 10rpx 16rpx rgba(93, 64, 55, 0.12);
}

.avatar-caption {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 10rpx;
	text-align: center;
	font-size: 20rpx;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: rgba(76, 55, 47, 0.86);
}

.persona-badge {
	padding: 10rpx 14rpx;
	border-radius: 999rpx;
}

.persona-code {
	font-size: 22rpx;
	font-weight: 700;
	color: #4c372f;
}

.persona-name {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #2c211e;
	line-height: 1.3;
}

.persona-tag {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #634d43;
}

.persona-note {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #4a3d37;
}

.footer-cta {
	margin: 28rpx 30rpx 48rpx;
	padding: 30rpx;
	border-radius: 36rpx;
	background: linear-gradient(180deg, #2f2a47 0%, #40355f 100%);
	box-shadow: 0 24rpx 40rpx rgba(57, 45, 83, 0.22);
}

.footer-title {
	display: block;
	font-size: 42rpx;
	font-weight: 700;
	color: #fff7ef;
}

.footer-text {
	display: block;
	margin: 14rpx 0 26rpx;
	font-size: 26rpx;
	line-height: 1.7;
	color: rgba(255, 247, 239, 0.8);
}

.wide-btn {
	width: 100%;
}

@media screen and (max-width: 420px) {
	.headline {
		font-size: 56rpx;
	}

	.hero-stage {
		width: 480rpx;
		height: 480rpx;
	}

	.card-grid {
		display: block;
	}

	.persona-card,
	.summary-card,
	.primary-btn,
	.ghost-btn {
		width: 100%;
	}

	.ghost-btn,
	.summary-card {
		margin-top: 18rpx;
	}

	.summary-panel {
		display: block;
	}
}
</style>

