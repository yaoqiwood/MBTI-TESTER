<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">鐢ㄤ竴鍦烘氮婕殑鎬ф牸婕父锛屾壘鍒颁綘鐖辩殑琛ㄨ揪鏂瑰紡</text>
				<text class="subhead">杩欐槸涓€寮犳病鏈夐鐩殑棣栭〉銆傚厛鎰熷彈 12 绉嶄汉鏍煎舰璞★紝鍐嶈繘鍏ュ師娴嬭瘯椤靛紑濮嬩綔绛斻€</text>
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
					<text>杩涘叆娴嬭瘯</text>
				</view>
				<view class="hero-action-btn ghost-btn" @click="scrollToGallery">
					<text>鍏堢湅浜烘牸褰㈣薄</text>
				</view>
			</view>
		</view>

		<view class="summary-panel">
			<view class="summary-card">
				<text class="summary-label">椋庢牸鍏抽敭璇</text>
				<text class="summary-value">鐩磋 / 鐑儓 / 鍏遍福 / 鎺㈢储</text>
			</view>
			<view class="summary-card">
				<text class="summary-label">閫傚悎鍦烘櫙</text>
				<text class="summary-value">鎭嬬埍閰嶅銆佽嚜鎴戣鐭ャ€佹湅鍙嬬牬鍐</text>
			</view>
		</view>

		<view class="gallery" id="gallery">
			<view class="section-head">
				<text class="section-kicker">12 PERSONAS</text>
				<text class="section-title">鍗佷簩绉嶄汉鏍煎舰璞</text>
				<text class="section-desc">涓嶆槸棰樼洰椤碉紝鑰屾槸浣犵殑绗竴鐪煎嵃璞″銆傛瘡涓€寮犲崱锛屽厛鍛婅瘔浣犱竴绉嶆皵璐ㄣ€</text>
			</view>

			<view class="card-grid">
				<view
					v-for="item in personas"
					:key="item.code"
					class="persona-card"
					:style="{ background: item.cardBg }"
				>
					<view class="persona-top">
						<view class="avatar-shell" :style="{ background: item.avatarBg }">
							<view class="avatar-face"></view>
							<view class="avatar-body"></view>
							<view class="avatar-accent" :style="{ background: item.accent }"></view>
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
			<text class="footer-title">鍑嗗濂戒簡灏卞紑濮</text>
			<text class="footer-text">鍘熸祴璇曢〉宸蹭繚鐣欙紝褰撳墠鍏堥€氳繃鎸夐挳鍒囨崲杩囧幓銆</text>
			<button class="primary-btn wide-btn" @click="goTest">鍓嶅線鍘熸祴璇曢〉</button>
		</view>
	</view>
</template>

<script>
const personas = [
	{
		code: 'INFP',
		name: '鏈堝厜鐞嗘兂瀹?,
		tagline: '娓╂煍銆佹兂璞″姏銆佹儏缁叡楦?,
		note: '鎿呴暱鍦ㄥ叧绯婚噷鍒堕€犵粏鑵绘皼鍥达紝鍠滄琚湡姝ｇ悊瑙ｃ€?,
		cardBg: 'linear-gradient(160deg, #fff6f0 0%, #ffd7c2 100%)',
		avatarBg: 'linear-gradient(180deg, #ffcfb3 0%, #ff9e7a 100%)',
		accent: '#8f4d32',
		badgeBg: '#fff2e8'
	},
	{
		code: 'ENFP',
		name: '鐑熺伀鍐掗櫓瀹?,
		tagline: '鐑儏銆佺伒鎰熴€佸嵆鏃跺績鍔?,
		note: '鑳芥妸涓€鍦烘櫘閫氬璇濓紝鐐圭噧鎴愯浜鸿浣忓緢涔呯殑澶滄櫄銆?,
		cardBg: 'linear-gradient(160deg, #fff9e8 0%, #ffe29f 100%)',
		avatarBg: 'linear-gradient(180deg, #ffe48b 0%, #ffc44d 100%)',
		accent: '#8d5a00',
		badgeBg: '#fff6cf'
	},
	{
		code: 'INFJ',
		name: '闈欒哀棰勮█瀹?,
		tagline: '娲炲療銆佸厠鍒躲€佹繁搴﹁繛鎺?,
		note: '琛ㄩ潰骞抽潤锛屽唴蹇冨嵈鏃╁凡鐪嬭鍏崇郴鐨勬湭鏉ヨ建杩广€?,
		cardBg: 'linear-gradient(160deg, #eef7ff 0%, #c9e7ff 100%)',
		avatarBg: 'linear-gradient(180deg, #b7defe 0%, #72b8ff 100%)',
		accent: '#1f5d96',
		badgeBg: '#e8f5ff'
	},
	{
		code: 'ENFJ',
		name: '鏆栧満鎸囨尌瀹?,
		tagline: '鎰熸煋鍔涖€佸寘瀹广€佸甫棰嗘劅',
		note: '涔犳儻鐓ч【鎵€鏈変汉鐨勬劅鍙楋紝涔熸渶鎳傚緱鎬庢牱璁╃埍钀藉湴銆?,
		cardBg: 'linear-gradient(160deg, #f5efff 0%, #dcc8ff 100%)',
		avatarBg: 'linear-gradient(180deg, #d6c3ff 0%, #a27bff 100%)',
		accent: '#5b36ae',
		badgeBg: '#f1eaff'
	},
	{
		code: 'INTP',
		name: '鏄熷浘鍒嗘瀽甯?,
		tagline: '鐞嗘€с€佸ソ濂囥€佸弽宸瓍鍔?,
		note: '涓嶈交鏄撳紑鍙ｏ紝浣嗕竴鏃﹁鐪熷洖搴旓紝鍙ュ彞閮藉緢鏈夊垎閲忋€?,
		cardBg: 'linear-gradient(160deg, #edfdf6 0%, #c4f2dd 100%)',
		avatarBg: 'linear-gradient(180deg, #b2ebd0 0%, #5bc18e 100%)',
		accent: '#1e6a4a',
		badgeBg: '#e8fbf2'
	},
	{
		code: 'ENTP',
		name: '鐏垫劅鐓藉姩鑰?,
		tagline: '鏈烘晱銆佽烦璺冦€佺帺蹇冨崄瓒?,
		note: '鎿呴暱璁╁叧绯讳繚鎸佹柊椴滄劅锛屾€昏兘鎻愬嚭鎰忔兂涓嶅埌鐨勫彲鑳姐€?,
		cardBg: 'linear-gradient(160deg, #fff3f7 0%, #ffc7d8 100%)',
		avatarBg: 'linear-gradient(180deg, #ffbfd1 0%, #ff729c 100%)',
		accent: '#9a2f54',
		badgeBg: '#ffe9f0'
	},
	{
		code: 'ISFP',
		name: '闆捐壊鑹烘湳瀹?,
		tagline: '鎰熷彈鍔涖€佸缇庛€佹參鐑湡蹇?,
		note: '涓嶅枾闂癸紝浣嗕細鐢ㄧ粏鑺傘€佺溂绁炲拰闄即琛ㄨ揪鍋忕埍銆?,
		cardBg: 'linear-gradient(160deg, #f7f4ef 0%, #ead7c1 100%)',
		avatarBg: 'linear-gradient(180deg, #e6d2b8 0%, #c79a66 100%)',
		accent: '#7a5528',
		badgeBg: '#f9f0e5'
	},
	{
		code: 'ESFP',
		name: '蹇冨姩鐜板満娲?,
		tagline: '娲诲姏銆佷翰杩戙€佸嵆鏃跺弽棣?,
		note: '鍠滄鎶婂枩娆㈣鍑烘潵锛屼篃鎿呴暱鎶婂揩涔愬垎浜粰韬竟鐨勪汉銆?,
		cardBg: 'linear-gradient(160deg, #f2fff6 0%, #c8f7d4 100%)',
		avatarBg: 'linear-gradient(180deg, #bff2c7 0%, #5dc576 100%)',
		accent: '#1f6b33',
		badgeBg: '#e9ffef'
	},
	{
		code: 'ISTJ',
		name: '绉╁簭瀹堟姢鑰?,
		tagline: '绋冲畾銆佸彲闈犮€佹參鎱㈠厬鐜?,
		note: '鐖变笉鏄儕澶╁姩鍦帮紝鑰屾槸鎶婄瓟搴旇繃鐨勪簨鎯呬竴浠朵欢鍋氬埌銆?,
		cardBg: 'linear-gradient(160deg, #f3f5f8 0%, #d6dde8 100%)',
		avatarBg: 'linear-gradient(180deg, #cfd7e5 0%, #8da0bf 100%)',
		accent: '#44556f',
		badgeBg: '#eef2f7'
	},
	{
		code: 'ESTJ',
		name: '琛屽姩涓荤悊浜?,
		tagline: '鐩存帴銆佹灉鏂€佹帉鎺ц妭濂?,
		note: '鎿呴暱鎺ㄥ姩鍏崇郴鍓嶈繘锛屽畨鍏ㄦ劅鏉ヨ嚜鏄庣‘鍜屾墽琛屻€?,
		cardBg: 'linear-gradient(160deg, #fff4ec 0%, #ffd3b3 100%)',
		avatarBg: 'linear-gradient(180deg, #ffcaa1 0%, #f58a4b 100%)',
		accent: '#8b451e',
		badgeBg: '#fff0e4'
	},
	{
		code: 'INTJ',
		name: '鍐风劙绛栧垝鑰?,
		tagline: '杩滆銆佽竟鐣屻€佹瀬鑷磋鐪?,
		note: '鐪嬭捣鏉ュ厠鍒讹紝鐪熸鍠滄鏃朵細鎷垮嚭灏戣鐨勬姇鍏ュ拰涓撴敞銆?,
		cardBg: 'linear-gradient(160deg, #eef1ff 0%, #c9d2ff 100%)',
		avatarBg: 'linear-gradient(180deg, #c1cbff 0%, #7387ff 100%)',
		accent: '#3343a2',
		badgeBg: '#ebeeff'
	},
	{
		code: 'ESFJ',
		name: '鐢滃害缁勭粐鑰?,
		tagline: '鍏虫€€銆佷綋璐淬€佸叧绯荤淮鎶?,
		note: '澶╃劧浼氱収椤炬皵姘涳紝涔熶細鐢ㄥ緢澶氬皬浠紡璁ょ湡缁忚惀鎰熸儏銆?,
		cardBg: 'linear-gradient(160deg, #fff8f3 0%, #ffe3d1 100%)',
		avatarBg: 'linear-gradient(180deg, #ffdcca 0%, #ffab7d 100%)',
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
				title: '鐧诲綍涓?,
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
					title: '寰俊鐧诲綍鎴愬姛',
					icon: 'none'
				})
				return true
			} catch (error) {
				uni.showToast({
					title: (error && (error.errMsg || error.message)) || '寰俊鐧诲綍澶辫触',
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
						reject(new Error('鏈幏鍙栧埌寰俊鐧诲綍鍑瘉'))
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
						title: '璇峰悜涓嬫粦鍔ㄦ煡鐪嬩汉鏍煎舰璞?,
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
	width: 120rpx;
	height: 136rpx;
	border-radius: 34rpx;
	overflow: hidden;
}

.avatar-face {
	position: absolute;
	left: 36rpx;
	top: 20rpx;
	width: 48rpx;
	height: 48rpx;
	background: rgba(255, 250, 242, 0.92);
	border-radius: 50%;
}

.avatar-body {
	position: absolute;
	left: 22rpx;
	bottom: -8rpx;
	width: 76rpx;
	height: 84rpx;
	background: rgba(255, 250, 242, 0.92);
	border-radius: 40rpx 40rpx 18rpx 18rpx;
}

.avatar-accent {
	position: absolute;
	right: -8rpx;
	top: -8rpx;
	width: 48rpx;
	height: 48rpx;
	border-radius: 18rpx;
	transform: rotate(18deg);
	opacity: 0.88;
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

