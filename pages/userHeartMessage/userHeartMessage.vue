<template>
	<view class="page">
		<view class="page-glow page-glow-left"></view>
		<view class="page-glow page-glow-right"></view>
		<view class="top-bar">
			<view class="top-copy">
				<text class="top-title">消息</text>
				<view class="top-subtitle-row">
					<text class="top-subtitle">今天也适合说句悄悄话</text>
					<text class="top-heart">♡</text>
				</view>
			</view>
			<view class="top-badge">
				<text>剩余心动值 {{ selfProfile.heart_message_quota || 0 }}</text>
			</view>
		</view>

		<view class="wechat-shell">
			<view class="search-bar">
				<view class="search-box">
					<text class="search-icon">搜</text>
					<input
						v-model.trim="keyword"
						class="search-input"
						placeholder="搜索昵称或姓名"
						confirm-type="search"
						@confirm="loadHome"
					/>
				</view>
				<text v-if="keyword" class="search-reset" @click="resetKeyword">清空</text>
			</view>

			<view class="panel contacts-panel">
				<view class="panel-head">
					<text class="panel-title">联系人</text>
					<text class="panel-tip">遇见 {{ contacts.length }} 位心动对象</text>
				</view>

				<view v-if="loading" class="empty-box">
					<text>正在加载联系人...</text>
				</view>
				<view v-else-if="!contacts.length" class="empty-box">
					<text>暂时还没有可聊天的人</text>
				</view>
				<view v-else class="contact-list">
					<view
						v-for="item in contacts"
						:key="item._id"
						class="contact-item"
						:class="activeContact && activeContact._id === item._id ? 'contact-item active' : ''"
						@click="selectContact(item)"
					>
						<view class="avatar-shell">
							<image
								v-if="item.personal_photo"
								class="avatar"
								:src="item.personal_photo"
								mode="aspectFill"
							></image>
							<view v-else class="avatar avatar-fallback">{{ getAvatarText(item.nickname || item.name) }}</view>
						</view>
						<view class="contact-main">
							<view class="contact-top">
								<view class="contact-name-row">
									<text class="contact-name">{{ item.nickname || item.name || '未命名联系人' }}</text>
									<text
										v-if="getGenderBadge(item.gender)"
										class="gender-badge"
										:class="getGenderBadge(item.gender).className"
									>
										{{ getGenderBadge(item.gender).symbol }}
									</text>
								</view>
								<text class="contact-time">{{ formatTime(item.latest_message_at) }}</text>
							</view>
							<text class="contact-meta">{{ item.name || '暂未填写姓名' }}</text>
							<view class="contact-preview-row">
								<text v-if="item.latest_message_type === 1" class="preview-tag heart-tag">心动消息</text>
								<text v-else-if="item.latest_message_type === 0" class="preview-tag normal-tag">普通消息</text>
								<text class="contact-preview">{{ item.latest_message || '还没有消息，快去打个招呼吧' }}</text>
							</view>
						</view>
						<view v-if="activeContact && activeContact._id === item._id" class="contact-active-dot"></view>
					</view>
				</view>
			</view>

		</view>

		<view v-if="showChatPopup && activeContact" class="chat-popup-mask" @click="closeChatPopup">
			<view class="chat-popup" @click.stop>
				<view class="chat-head">
					<view class="chat-user">
						<view class="avatar-shell small">
							<image
								v-if="activeContact.personal_photo"
								class="avatar"
								:src="activeContact.personal_photo"
								mode="aspectFill"
							></image>
							<view v-else class="avatar avatar-fallback">{{ getAvatarText(activeContact.nickname || activeContact.name) }}</view>
						</view>
						<view class="chat-user-text">
							<text class="chat-name">{{ activeContact.nickname || activeContact.name }}</text>
							<text class="chat-meta">{{ activeContact.name || '未填写姓名' }}</text>
							<text class="chat-mood">和 Ta 的聊天，也许会有一点点心动</text>
						</view>
					</view>
					<view class="chat-head-actions">
						<view class="quota-badge">
							<text>{{ selfProfile.heart_message_quota || 0 }} 点</text>
						</view>
						<text class="chat-close" @click="closeChatPopup">×</text>
					</view>
				</view>

				<scroll-view
					scroll-y
					class="message-scroll popup-message-scroll"
					:scroll-into-view="scrollIntoView"
					scroll-with-animation
				>
					<view v-if="chatLoading" class="empty-box small-empty">
						<text>正在加载聊天记录...</text>
					</view>
					<view v-else-if="!messages.length" class="empty-box small-empty">
						<text>还没有聊天记录，主动说句话吧</text>
					</view>
					<view v-else class="message-list">
						<view
							v-for="item in messages"
							:id="'msg-' + item._id"
							:key="item._id"
							class="message-row"
							:class="item.sender_record_id === selfProfile._id ? 'mine' : 'other'"
						>
							<text class="bubble-time">{{ formatDateTime(item.created_at_text || item.created_at) }}</text>
							<view class="bubble-wrap">
								<view class="avatar-shell mini" v-if="item.sender_record_id !== selfProfile._id">
									<image
										v-if="activeContact.personal_photo"
										class="avatar"
										:src="activeContact.personal_photo"
										mode="aspectFill"
									></image>
									<view v-else class="avatar avatar-fallback">{{ getAvatarText(activeContact.nickname || activeContact.name) }}</view>
								</view>
								<view class="bubble-box">
									<text v-if="item.type === 1" class="bubble-type heart-tag">心动消息</text>
									<text v-else class="bubble-type normal-tag">普通消息</text>
									<view class="bubble">
										<text class="bubble-text">{{ item.content }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>

				<view class="composer">
					<view class="type-row">
						<view
							class="type-chip"
							:class="messageType === 0 ? 'type-chip active' : ''"
							@click="messageType = 0"
						>
							普通消息
						</view>
						<view
							class="type-chip heart-chip"
							:class="messageType === 1 ? 'type-chip active heart-chip' : 'type-chip heart-chip'"
							@click="messageType = 1"
						>
							心动消息
						</view>
					</view>
					<textarea
						v-model.trim="draftMessage"
						class="composer-input"
						maxlength="300"
						placeholder="输入你想说的话"
					></textarea>
					<view class="composer-foot">
						<text class="composer-tip">
							{{ messageType === 1 ? '发送心动消息会消耗 1 点心动值' : '发送普通消息不会消耗心动值' }}
						</text>
						<button class="send-btn" :disabled="sending" @click="sendMessage">发送</button>
					</view>
				</view>
			</view>
		</view>

		<view class="bottom-nav">
			<view class="bottom-tab bottom-tab-active">
				<text class="bottom-tab-icon">人</text>
				<text class="bottom-tab-text">联系人</text>
			</view>
			<view class="bottom-tab" @click="openInbox">
				<text class="bottom-tab-icon">信</text>
				<text class="bottom-tab-text">收信箱</text>
			</view>
		</view>
	</view>
</template>

<script>
const PERSONNEL_PROFILE_STORAGE_KEY = 'mbtiPersonnelProfile'
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
			chatLoading: false,
			sending: false,
			keyword: '',
			personnelId: '',
			selfProfile: {
				_id: '',
				person_id: '',
				nickname: '',
				name: '',
				mbti: '',
				personal_photo: '',
				heart_message_quota: 0
			},
			contacts: [],
			activeContact: null,
			showChatPopup: false,
			messages: [],
			draftMessage: '',
			messageType: 0,
			scrollIntoView: ''
		}
	},
	onLoad() {
		if (!this.ensurePageAccess()) {
			return
		}
		this.loadHome()
	},
	methods: {
		getStoredProfile() {
			try {
				const profile = uni.getStorageSync(PERSONNEL_PROFILE_STORAGE_KEY)
				return profile && typeof profile === 'object' ? profile : null
			} catch (error) {
				return null
			}
		},
		ensurePageAccess() {
			const profile = this.getStoredProfile()
			const adminRole = Number(profile && profile.admin_role) || 0
			if (!profile || !(profile.personnel_id || profile.id)) {
				uni.reLaunch({ url: '/pages/mbti-home/home' })
				return false
			}
			if (adminRole !== 0) {
				uni.reLaunch({ url: '/pages/adminHome/gameQueryManagement' })
				return false
			}
			this.personnelId = profile.personnel_id || profile.id || ''
			return !!this.personnelId
		},
		async loadHome() {
			if (!personnelAdmin || !this.personnelId) {
				return
			}
			this.loading = true
			try {
				const res = await personnelAdmin.getUserHeartMessageHome({
					personnelId: this.personnelId,
					keyword: this.keyword
				})
				this.selfProfile = Object.assign({}, this.selfProfile, res && res.self ? res.self : {})
				this.contacts = Array.isArray(res && res.contacts) ? res.contacts : []
				if (!this.contacts.length) {
					this.showChatPopup = false
					this.activeContact = null
					this.messages = []
					return
				}
				if (this.activeContact && this.activeContact._id) {
					const nextActive = this.contacts.find((item) => item._id === this.activeContact._id)
					if (nextActive) {
						this.activeContact = Object.assign({}, this.activeContact, nextActive)
					} else {
						this.showChatPopup = false
						this.activeContact = null
						this.messages = []
					}
				}
			} catch (error) {
				uni.showToast({
					title: (error && error.message) || '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		async selectContact(item) {
			if (!item || !item._id || !personnelAdmin) {
				return
			}
			this.showChatPopup = true
			this.activeContact = item
			this.chatLoading = true
			try {
				const res = await personnelAdmin.listUserHeartMessages({
					personnelId: this.personnelId,
					contactId: item._id
				})
				this.selfProfile = Object.assign({}, this.selfProfile, res && res.self ? res.self : {})
				this.activeContact = Object.assign({}, item, res && res.contact ? res.contact : {})
				this.messages = Array.isArray(res && res.list) ? res.list : []
				this.$nextTick(() => {
					const lastMessage = this.messages[this.messages.length - 1]
					this.scrollIntoView = lastMessage ? 'msg-' + lastMessage._id : ''
				})
			} catch (error) {
				uni.showToast({
					title: (error && error.message) || '聊天记录加载失败',
					icon: 'none'
				})
			} finally {
				this.chatLoading = false
			}
		},
		closeChatPopup() {
			this.showChatPopup = false
		},
		resetKeyword() {
			this.keyword = ''
			this.loadHome()
		},
		openInbox() {
			uni.showToast({
				title: '收信箱功能准备中',
				icon: 'none'
			})
		},
		async sendMessage() {
			if (!this.activeContact || !this.activeContact._id) {
				return
			}
			if (!this.draftMessage) {
				uni.showToast({
					title: '请输入消息内容',
					icon: 'none'
				})
				return
			}
			if (this.messageType === 1 && Number(this.selfProfile.heart_message_quota || 0) < 1) {
				uni.showToast({
					title: '心动值不足',
					icon: 'none'
				})
				return
			}
			if (this.sending) {
				return
			}
			this.sending = true
			try {
				await personnelAdmin.sendUserHeartMessage({
					personnelId: this.personnelId,
					contactId: this.activeContact._id,
					content: this.draftMessage,
					type: this.messageType
				})
				const currentContactId = this.activeContact._id
				this.draftMessage = ''
				this.messageType = 0
				await this.loadHome()
				const nextActive = this.contacts.find((item) => item._id === currentContactId)
				if (nextActive) {
					await this.selectContact(nextActive)
				}
				uni.showToast({
					title: '发送成功',
					icon: 'success'
				})
			} catch (error) {
				uni.showToast({
					title: (error && error.message) || '发送失败',
					icon: 'none'
				})
			} finally {
				this.sending = false
			}
		},
		getAvatarText(value) {
			const text = String(value || '').trim()
			return text ? text.slice(0, 1) : '聊'
		},
		getGenderBadge(value) {
			const gender = String(value || '').trim().toLowerCase()
			if (gender === '男' || gender === '1' || gender === 'm' || gender === 'male' || gender === 'man') {
				return {
					symbol: '♂',
					className: 'gender-male'
				}
			}
			if (gender === '女' || gender === '2' || gender === 'f' || gender === 'female' || gender === 'woman') {
				return {
					symbol: '♀',
					className: 'gender-female'
				}
			}
			return null
		},
		formatTime(value) {
			if (!value) {
				return ''
			}
			const date = new Date(value)
			if (Number.isNaN(date.getTime())) {
				return ''
			}
			const now = new Date()
			const isSameDay =
				now.getFullYear() === date.getFullYear() &&
				now.getMonth() === date.getMonth() &&
				now.getDate() === date.getDate()
			if (isSameDay) {
				return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
			}
			const yesterday = new Date(now)
			yesterday.setDate(now.getDate() - 1)
			const isYesterday =
				yesterday.getFullYear() === date.getFullYear() &&
				yesterday.getMonth() === date.getMonth() &&
				yesterday.getDate() === date.getDate()
			if (isYesterday) {
				return '昨天'
			}
			return `${date.getMonth() + 1}月${date.getDate()}日`
		},
		formatDateTime(value) {
			if (!value) {
				return ''
			}
			const date = new Date(value)
			if (Number.isNaN(date.getTime())) {
				return ''
			}
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hour = String(date.getHours()).padStart(2, '0')
			const minute = String(date.getMinutes()).padStart(2, '0')
			return `${year}-${month}-${day} ${hour}:${minute}`
		}
	}
}
</script>

<style>
.page {
	position: relative;
	min-height: 100vh;
	background:
		radial-gradient(circle at top left, rgba(222, 236, 224, 0.86), transparent 28%),
		radial-gradient(circle at top right, rgba(244, 230, 199, 0.76), transparent 24%),
		linear-gradient(180deg, #faf9f5 0%, #f2f0e9 38%, #eae8e0 100%);
	box-sizing: border-box;
	overflow: hidden;
}

.page-glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(10rpx);
	opacity: 0.8;
	pointer-events: none;
}

.page-glow-left {
	left: -80rpx;
	top: 140rpx;
	width: 220rpx;
	height: 220rpx;
	background: rgba(184, 214, 188, 0.62);
}

.page-glow-right {
	right: -60rpx;
	top: 420rpx;
	width: 180rpx;
	height: 180rpx;
	background: rgba(220, 205, 168, 0.58);
}

.top-bar {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 24rpx 18rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(246, 244, 236, 0.34) 100%);
}

.top-copy {
	max-width: 70%;
}

.top-title {
	display: block;
	font-size: 40rpx;
	font-weight: 700;
	color: #2f342d;
}

.top-subtitle-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.top-subtitle {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #72786c;
}

.top-heart {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #7da57f;
}

.top-badge {
	padding: 12rpx 20rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #edf4e9 0%, #f9f1dc 100%);
	font-size: 24rpx;
	color: #5f775d;
	box-shadow: 0 10rpx 24rpx rgba(127, 149, 118, 0.12);
}

.wechat-shell {
	position: relative;
	z-index: 1;
	padding: 0 0 164rpx;
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 0 24rpx 20rpx;
}

.search-box {
	flex: 1;
	height: 72rpx;
	padding: 0 24rpx;
	border-radius: 18rpx;
	background: rgba(255, 255, 255, 0.92);
	display: flex;
	align-items: center;
	box-sizing: border-box;
	box-shadow: 0 12rpx 24rpx rgba(140, 146, 122, 0.1);
}

.search-icon {
	margin-right: 16rpx;
	font-size: 24rpx;
	color: #999999;
}

.search-input {
	flex: 1;
	height: 72rpx;
	font-size: 26rpx;
	color: #222222;
}

.search-reset {
	font-size: 26rpx;
	color: #6b7d63;
}

.panel {
	margin: 0 24rpx 24rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 18rpx 34rpx rgba(126, 128, 111, 0.1);
	backdrop-filter: blur(8rpx);
}

.panel-head,
.contact-item,
.contact-top,
.contact-preview-row,
.chat-head,
.chat-user,
.composer-foot,
.type-row,
.message-row,
.bubble-wrap {
	display: flex;
}

.panel-head {
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	border-bottom: 1rpx solid #ece8dc;
}

.panel-title,
.chat-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #2f342d;
}

.panel-tip,
.contact-meta,
.contact-preview,
.chat-meta,
.composer-tip,
.bubble-time,
.empty-box,
.empty-chat-tip {
	font-size: 24rpx;
	color: #7c7f73;
}

.contact-list {
	background: transparent;
}

.contact-item {
	align-items: center;
	padding: 22rpx 24rpx;
	gap: 20rpx;
	position: relative;
	transition: all 0.2s ease;
}

.contact-item::after {
	content: '';
	position: absolute;
	left: 140rpx;
	right: 24rpx;
	bottom: 0;
	height: 1rpx;
	background: #ece8dc;
}

.contact-item:last-child::after,
.contact-item.active::after {
	display: none;
}

.contact-item.active {
	background: linear-gradient(135deg, #f4f6ef 0%, #faf7ec 100%);
}

.avatar-shell {
	flex-shrink: 0;
	width: 96rpx;
	height: 96rpx;
	border-radius: 20rpx;
	overflow: hidden;
	background: linear-gradient(180deg, #dcebd8 0%, #efe2bb 100%);
	box-shadow: 0 10rpx 20rpx rgba(150, 162, 129, 0.16);
}

.avatar-shell.small {
	width: 76rpx;
	height: 76rpx;
	border-radius: 18rpx;
}

.avatar-shell.mini {
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
}

.avatar {
	width: 100%;
	height: 100%;
}

.avatar-fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: linear-gradient(180deg, #88b97a 0%, #d8bc73 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 700;
}

.contact-main {
	flex: 1;
	min-width: 0;
}

.contact-top {
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.contact-name-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
}

.contact-name {
	font-size: 30rpx;
	color: #33392f;
}

.gender-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 40rpx;
	height: 40rpx;
	padding: 0 10rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 700;
	color: #ffffff;
	line-height: 1;
	flex-shrink: 0;
}

.gender-male {
	background: linear-gradient(135deg, #63a8ff 0%, #3f7df2 100%);
	box-shadow: 0 8rpx 16rpx rgba(80, 139, 255, 0.2);
}

.gender-female {
	background: linear-gradient(135deg, #ff92b2 0%, #ff6f9a 100%);
	box-shadow: 0 8rpx 16rpx rgba(255, 127, 164, 0.2);
}

.contact-time {
	font-size: 22rpx;
	color: #999999;
}

.contact-meta {
	display: block;
	margin-top: 6rpx;
}

.contact-preview-row {
	align-items: center;
	gap: 12rpx;
	margin-top: 10rpx;
}

.preview-tag,
.bubble-type {
	flex-shrink: 0;
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
}

.normal-tag {
	background: #eef1ea;
	color: #6c7568;
}

.heart-tag {
	background: linear-gradient(135deg, #e8f2e3 0%, #f6ebcf 100%);
	color: #8a6a3f;
}

.contact-preview {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.contact-active-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: #7cab79;
	box-shadow: 0 0 0 8rpx rgba(124, 171, 121, 0.12);
}

.chat-panel {
	background:
		linear-gradient(180deg, rgba(249, 248, 242, 0.96) 0%, rgba(244, 241, 233, 0.96) 100%);
}

.chat-popup-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 40;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding: 40rpx 24rpx calc(120rpx + env(safe-area-inset-bottom));
	background: rgba(38, 42, 34, 0.38);
	box-sizing: border-box;
}

.chat-popup {
	width: 100%;
	max-height: 100%;
	border-radius: 28rpx;
	overflow: hidden;
	background:
		linear-gradient(180deg, rgba(249, 248, 242, 0.98) 0%, rgba(244, 241, 233, 0.98) 100%);
	box-shadow: 0 24rpx 56rpx rgba(56, 63, 51, 0.2);
}

.chat-head {
	align-items: center;
	justify-content: space-between;
	padding: 22rpx 24rpx;
	background: linear-gradient(135deg, #f8faf3 0%, #f7f1e2 100%);
	border-bottom: 1rpx solid #e8e3d5;
}

.chat-head-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-left: 16rpx;
}

.chat-close {
	width: 52rpx;
	height: 52rpx;
	line-height: 48rpx;
	border-radius: 50%;
	text-align: center;
	font-size: 36rpx;
	color: #6a7262;
	background: rgba(255, 255, 255, 0.72);
}

.chat-user {
	align-items: center;
	gap: 18rpx;
	flex: 1;
	min-width: 0;
}

.chat-user-text {
	flex: 1;
	min-width: 0;
}

.chat-name,
.chat-meta {
	display: block;
}

.chat-mood {
	display: block;
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #87907d;
}

.message-scroll {
	height: 720rpx;
	padding: 24rpx 24rpx 8rpx;
	box-sizing: border-box;
}

.popup-message-scroll {
	height: 68vh;
	min-height: 520rpx;
	max-height: 820rpx;
}

.message-list {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
}

.message-row {
	flex-direction: column;
}

.bubble-wrap {
	align-items: flex-start;
	gap: 14rpx;
	margin-top: 8rpx;
}

.message-row.mine .bubble-wrap {
	justify-content: flex-end;
}

.message-row.mine .bubble-wrap {
	flex-direction: row-reverse;
}

.bubble-box {
	max-width: 78%;
}

.message-row.mine .bubble-box {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.message-row.mine .bubble {
	background: linear-gradient(135deg, #d8e9cf 0%, #efe0ad 100%);
}

.bubble {
	position: relative;
	padding: 20rpx 22rpx;
	border-radius: 14rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 18rpx rgba(139, 141, 121, 0.1);
}

.message-row.other .bubble::before {
	content: '';
	position: absolute;
	left: -10rpx;
	top: 22rpx;
	width: 20rpx;
	height: 20rpx;
	background: #ffffff;
	transform: rotate(45deg);
	border-radius: 4rpx;
}

.message-row.mine .bubble::before {
	content: '';
	position: absolute;
	right: -10rpx;
	top: 22rpx;
	width: 20rpx;
	height: 20rpx;
	background: #e8d59d;
	transform: rotate(45deg);
	border-radius: 4rpx;
}

.bubble-text {
	font-size: 28rpx;
	line-height: 1.6;
	color: #353a30;
	word-break: break-word;
}

.composer {
	padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, #faf9f4 0%, #f5f1e7 100%);
	border-top: 1rpx solid #e8e2d4;
}

.type-row {
	gap: 14rpx;
}

.type-chip {
	padding: 12rpx 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.95);
	font-size: 24rpx;
	color: #6d7569;
	box-shadow: 0 8rpx 16rpx rgba(152, 153, 129, 0.08);
}

.type-chip.active {
	background: linear-gradient(135deg, #8ab47e 0%, #d8ba73 100%);
	color: #ffffff;
}

.type-chip.active.heart-chip {
	background: linear-gradient(135deg, #7da66f 0%, #c9a75d 100%);
}

.composer-input {
	width: 100%;
	min-height: 148rpx;
	margin-top: 18rpx;
	padding: 20rpx 22rpx;
	border-radius: 18rpx;
	background: rgba(255, 255, 255, 0.94);
	box-sizing: border-box;
	font-size: 28rpx;
	color: #222222;
	box-shadow: inset 0 0 0 1rpx #e6e1d5;
}

.composer-foot {
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 16rpx;
}

.composer-tip {
	flex: 1;
	line-height: 1.5;
}

.send-btn {
	width: 152rpx;
	height: 72rpx;
	line-height: 72rpx;
	margin: 0;
	border-radius: 14rpx;
	background: linear-gradient(135deg, #7ea870 0%, #cdaa61 100%);
	color: #ffffff;
	font-size: 28rpx;
	box-shadow: 0 12rpx 22rpx rgba(126, 150, 103, 0.2);
}

.send-btn[disabled] {
	opacity: 0.6;
}

.quota-badge {
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #edf4e9 0%, #f7edd7 100%);
	font-size: 22rpx;
	color: #61795d;
}

.empty-box,
.empty-chat-panel {
	padding: 56rpx 24rpx;
	text-align: center;
}

.small-empty {
	padding-top: 140rpx;
}

.empty-chat-title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #41463c;
}

.empty-chat-tip {
	display: block;
	margin-top: 12rpx;
}

.bottom-nav {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: calc(20rpx + env(safe-area-inset-bottom));
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 16rpx;
	border-radius: 28rpx;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 16rpx 30rpx rgba(126, 128, 111, 0.14);
	backdrop-filter: blur(12rpx);
}

.bottom-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	height: 84rpx;
	border-radius: 22rpx;
	color: #6b7265;
	background: #f5f4ee;
}

.bottom-tab-active {
	background: linear-gradient(135deg, #e7f0e0 0%, #f2ead0 100%);
	color: #4f654a;
}

.bottom-tab-icon {
	width: 36rpx;
	height: 36rpx;
	line-height: 36rpx;
	border-radius: 50%;
	text-align: center;
	font-size: 22rpx;
	background: rgba(255, 255, 255, 0.72);
}

.bottom-tab-text {
	font-size: 26rpx;
	font-weight: 600;
}

@media screen and (max-width: 420px) {
	.top-bar,
	.search-bar {
		padding-left: 20rpx;
		padding-right: 20rpx;
	}

	.panel {
		margin-left: 20rpx;
		margin-right: 20rpx;
	}

	.composer-foot {
		align-items: flex-start;
		flex-direction: column;
	}

	.send-btn {
		width: 100%;
	}

	.bottom-nav {
		left: 20rpx;
		right: 20rpx;
	}

	.chat-popup-mask {
		padding-left: 20rpx;
		padding-right: 20rpx;
	}
}
</style>
