<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>
			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">信息确认</text>
				<text class="subhead">填写姓名与口令后提交。姓名支持输入搜索，若与候选名单不匹配，失焦后会自动清空。</text>
			</view>

			<view class="form-card">
				<view class="field-block">
					<text class="field-label">姓名：</text>
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
							:key="item"
							class="option-item"
							@touchstart="selectName(item)"
							@mousedown="selectName(item)"
						>
							<text>{{ item }}</text>
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
const nameOptions = ['林夏', '周然', '顾北', '程意', '许棠', '沈知意', '宋安', '陆鸣']

export default {
	data() {
		return {
			nameOptions,
			nameInput: '',
			selectedName: '',
			password: '',
			showNameOptions: false
		}
	},
	computed: {
		filteredNames() {
			const keyword = this.nameInput.trim().toLowerCase()
			if (!keyword) {
				return this.nameOptions
			}
			return this.nameOptions.filter((item) => item.toLowerCase().includes(keyword))
		}
	},
	methods: {
		handleNameFocus() {
			this.showNameOptions = true
		},
		handleNameInput(event) {
			this.nameInput = event.detail.value
			this.selectedName = ''
			this.showNameOptions = true
		},
		handleNameBlur() {
			setTimeout(() => {
				const value = this.nameInput.trim()
				if (!this.nameOptions.includes(value)) {
					this.nameInput = ''
					this.selectedName = ''
				} else {
					this.nameInput = value
					this.selectedName = value
				}
				this.showNameOptions = false
			}, 120)
		},
		selectName(name) {
			this.nameInput = name
			this.selectedName = name
			this.showNameOptions = false
		},
		submitForm() {
			const name = this.selectedName || this.nameInput.trim()
			if (!this.nameOptions.includes(name)) {
				this.nameInput = ''
				this.selectedName = ''
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
			uni.showToast({
				title: '提交成功',
				icon: 'success'
			})
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/test/test?name=${encodeURIComponent(name)}`
				})
			}, 450)
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
	display: block;
	margin-top: 16rpx;
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
