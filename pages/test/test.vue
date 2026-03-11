<template>
	<view class="test-page">
		<view class="switch-bar">
			<view class="switch-copy">
				<text class="switch-title">原测试页已保留</text>
				<text class="switch-desc">现在默认首页已经切到 MBTI 展示页，这里先放一个切换按钮方便来回跳转。</text>
			</view>
			<view class="switch-actions">
				<button class="home-btn" @click="goHome">返回首页</button>
				<button class="cloud-btn" @click="goCloudObject">云对象页</button>
			</view>
		</view>
		<show-code :codes="schemaCode"></show-code>
		<!-- <alertCode ref="alertCode"></alertCode> -->
		<!-- <button @click="openFn()" type="default">alertCode</button> -->
		<!-- <view v-for="(value,key) in schemaCode">
			<text class="key">{{key}}:</text>
			<text class="value">{{value}}</text>
		</view> -->
	</view>
</template>

<script>
import schemaCode from './schemaCode.json';
	export default {
		data() {
			return {
				schemaCode:schemaCode
			}
		},
		methods: {
			goHome() {
				uni.navigateTo({
					url: '/pages/mbti-home/index'
				})
			},
			goCloudObject() {
				uni.navigateTo({
					url: '/pages/cloudObject/cloudObject'
				})
			},
			openFn(){
				console.log(this.$refs.alertCode.open(this.schemaCode));
				//
			}
		}
	}
</script>

<style>
.test-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #fff8f2 0%, #fffdf9 100%);
}

.switch-bar {
	margin: 24rpx;
	padding: 28rpx;
	border-radius: 28rpx;
	background: linear-gradient(135deg, #2f2a47 0%, #5b4b85 100%);
	box-shadow: 0 18rpx 36rpx rgba(67, 53, 98, 0.18);
}

.switch-copy {
	margin-bottom: 20rpx;
}

.switch-actions {
	display: flex;
	justify-content: space-between;
}

.switch-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #fff8f0;
}

.switch-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 25rpx;
	line-height: 1.7;
	color: rgba(255, 248, 240, 0.8);
}

.home-btn,
.cloud-btn {
	width: 320rpx;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 999rpx;
	font-size: 28rpx;
	font-weight: 600;
}

.home-btn {
	background: #fff7ef;
	color: #3e315d;
}

.cloud-btn {
	background: rgba(255, 255, 255, 0.14);
	color: #fff8f0;
	border: 2rpx solid rgba(255, 248, 240, 0.28);
}

.home-btn::after,
.cloud-btn::after {
	border: none;
}
</style>
