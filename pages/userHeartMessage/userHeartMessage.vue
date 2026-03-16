<template>
	<view class="page">
		<view class="hero-card">
			<view class="hero-copy">
				<text class="hero-kicker">LOVE MBTI CHAT</text>
				<text class="hero-title">Contacts</text>
				<text class="hero-desc">A WeChat-like contact-first chat screen. Normal messages are free, heart messages cost one heart.</text>
			</view>
			<view class="hero-stats">
				<view class="hero-pill">
					<text class="hero-pill-label">My Hearts</text>
					<text class="hero-pill-value">{{ selfProfile.heart_message_quota || 0 }}</text>
				</view>
				<view class="hero-pill">
					<text class="hero-pill-label">Contacts</text>
					<text class="hero-pill-value">{{ contacts.length }}</text>
				</view>
			</view>
		</view>

		<view class="search-card">
			<input
				v-model.trim="keyword"
				class="search-input"
				placeholder="Search nickname / name / MBTI"
				confirm-type="search"
				@confirm="loadHome"
			/>
			<view class="search-actions">
				<button class="light-btn" @click="resetKeyword">Reset</button>
				<button class="solid-btn" @click="loadHome">Search</button>
			</view>
		</view>

		<view class="contacts-card">
			<view class="section-head">
				<text class="section-title">Contact List</text>
				<text class="section-tip">Tap a contact to open the conversation below.</text>
			</view>

			<view v-if="loading" class="empty-box">
				<text>Loading contacts...</text>
			</view>
			<view v-else-if="!contacts.length" class="empty-box">
				<text>No contacts available yet</text>
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
							<text class="contact-name">{{ item.nickname || item.name || 'Unknown' }}</text>
							<text class="contact-time">{{ formatTime(item.latest_message_at) }}</text>
						</view>
						<text class="contact-meta">{{ item.name || 'No name' }} / {{ item.mbti || 'MBTI pending' }}</text>
						<view class="contact-preview-row">
							<text v-if="item.latest_message_type === 1" class="preview-tag heart-tag">Heart</text>
							<text v-else-if="item.latest_message_type === 0" class="preview-tag normal-tag">Normal</text>
							<text class="contact-preview">{{ item.latest_message || 'No messages yet, say hello first.' }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-if="activeContact" class="chat-card">
			<view class="chat-head">
				<view class="chat-head-main">
					<text class="section-title">{{ activeContact.nickname || activeContact.name }}</text>
					<text class="section-tip">{{ activeContact.name || '-' }} / {{ activeContact.mbti || '-' }}</text>
				</view>
				<view class="quota-badge">
					<text>Hearts left {{ selfProfile.heart_message_quota || 0 }}</text>
				</view>
			</view>

			<scroll-view
				scroll-y
				class="message-scroll"
				:scroll-into-view="scrollIntoView"
				scroll-with-animation
			>
				<view v-if="chatLoading" class="empty-box small-empty">
					<text>Loading conversation...</text>
				</view>
				<view v-else-if="!messages.length" class="empty-box small-empty">
					<text>No messages yet. Start the conversation.</text>
				</view>
				<view v-else class="message-list">
					<view
						v-for="item in messages"
						:id="'msg-' + item._id"
						:key="item._id"
						class="message-row"
						:class="item.sender_record_id === selfProfile._id ? 'mine' : 'other'"
					>
						<view class="bubble-meta">
							<text class="bubble-author">{{
								item.sender_record_id === selfProfile._id ? 'Me' : activeContact.nickname || activeContact.name
							}}</text>
							<text class="bubble-time">{{ formatDateTime(item.created_at_text || item.created_at) }}</text>
						</view>
						<view class="bubble-wrap">
							<text v-if="item.type === 1" class="bubble-type heart-tag">Heart Message</text>
							<text v-else class="bubble-type normal-tag">Normal Message</text>
							<view class="bubble">
								<text class="bubble-text">{{ item.content }}</text>
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
						Normal
					</view>
					<view
						class="type-chip heart-chip"
						:class="messageType === 1 ? 'type-chip active heart-chip' : 'type-chip heart-chip'"
						@click="messageType = 1"
					>
						Heart
					</view>
				</view>
				<textarea
					v-model.trim="draftMessage"
					class="composer-input"
					maxlength="300"
					placeholder="Type a message..."
				></textarea>
				<view class="composer-foot">
					<text class="composer-tip">
						{{ messageType === 1 ? 'A heart message costs 1 heart.' : 'A normal message costs 0 hearts.' }}
					</text>
					<button class="solid-btn" :disabled="sending" @click="sendMessage">Send</button>
				</view>
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
					this.activeContact = null
					this.messages = []
					return
				}
				const nextActive =
					this.contacts.find((item) => item._id === (this.activeContact && this.activeContact._id)) ||
					this.contacts[0]
				await this.selectContact(nextActive)
			} catch (error) {
				uni.showToast({
					title: (error && error.message) || 'Load failed',
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
					title: (error && error.message) || 'Chat load failed',
					icon: 'none'
				})
			} finally {
				this.chatLoading = false
			}
		},
		resetKeyword() {
			this.keyword = ''
			this.loadHome()
		},
		async sendMessage() {
			if (!this.activeContact || !this.activeContact._id) {
				return
			}
			if (!this.draftMessage) {
				uni.showToast({
					title: 'Enter message',
					icon: 'none'
				})
				return
			}
			if (this.messageType === 1 && Number(this.selfProfile.heart_message_quota || 0) < 1) {
				uni.showToast({
					title: 'No hearts left',
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
				this.draftMessage = ''
				this.messageType = 0
				await this.loadHome()
				uni.showToast({
					title: 'Sent',
					icon: 'success'
				})
			} catch (error) {
				uni.showToast({
					title: (error && error.message) || 'Send failed',
					icon: 'none'
				})
			} finally {
				this.sending = false
			}
		},
		getAvatarText(value) {
			const text = String(value || '').trim()
			return text ? text.slice(0, 1) : 'C'
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
			return `${date.getMonth() + 1}/${date.getDate()}`
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
	min-height: 100vh;
	padding: 24rpx;
	background: #f5efe5;
	box-sizing: border-box;
}

.hero-card,
.search-card,
.contacts-card,
.chat-card {
	background: #fffcf7;
	border: 1rpx solid #eadfce;
	border-radius: 28rpx;
	box-shadow: 0 18rpx 40rpx rgba(91, 70, 40, 0.08);
}

.hero-card,
.search-card,
.contacts-card,
.chat-card {
	padding: 28rpx;
}

.search-card,
.contacts-card,
.chat-card {
	margin-top: 24rpx;
}

.hero-kicker {
	font-size: 22rpx;
	letter-spacing: 4rpx;
	color: #8f6840;
}

.hero-title {
	display: block;
	margin-top: 14rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #2c241c;
}

.hero-desc,
.section-tip,
.contact-meta,
.contact-preview,
.composer-tip,
.bubble-time,
.bubble-author {
	font-size: 24rpx;
	line-height: 1.6;
	color: #716250;
}

.hero-desc {
	display: block;
	margin-top: 14rpx;
}

.hero-stats,
.search-actions,
.contact-item,
.contact-top,
.contact-preview-row,
.chat-head,
.chat-head-main,
.composer-foot,
.type-row,
.message-row,
.bubble-wrap {
	display: flex;
}

.hero-stats,
.type-row {
	gap: 16rpx;
}

.hero-stats {
	margin-top: 24rpx;
}

.hero-pill,
.quota-badge {
	padding: 16rpx 20rpx;
	border-radius: 22rpx;
	background: #f7f1e6;
}

.hero-pill {
	flex: 1;
}

.hero-pill-label {
	display: block;
	font-size: 22rpx;
	color: #7c6b57;
}

.hero-pill-value {
	display: block;
	margin-top: 8rpx;
	font-size: 38rpx;
	font-weight: 700;
	color: #2e241b;
}

.search-input,
.composer-input {
	width: 100%;
	background: #fbf8f2;
	border: 1rpx solid #dfd3c1;
	border-radius: 20rpx;
	box-sizing: border-box;
	color: #342b22;
	font-size: 26rpx;
}

.search-input {
	height: 84rpx;
	padding: 0 24rpx;
	line-height: 84rpx;
}

.search-actions {
	margin-top: 20rpx;
	justify-content: flex-end;
}

.solid-btn,
.light-btn {
	height: 76rpx;
	line-height: 76rpx;
	padding: 0 28rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	margin: 0 0 0 20rpx;
}

.solid-btn {
	background: #1f6b52;
	color: #ffffff;
}

.light-btn {
	background: #f7f1e6;
	color: #5b4a35;
}

.section-head,
.chat-head-main {
	flex-direction: column;
}

.section-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #2d241c;
}

.section-tip {
	margin-top: 8rpx;
}

.contact-list {
	margin-top: 24rpx;
}

.contact-item {
	align-items: center;
	gap: 20rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #eadfce;
}

.contact-item.active {
	margin: 0 -16rpx;
	padding: 22rpx 16rpx;
	border-radius: 22rpx;
	background: #fff6ea;
	border-bottom-color: transparent;
}

.contact-item:last-child {
	border-bottom: none;
}

.avatar-shell {
	flex-shrink: 0;
}

.avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 28rpx;
	background: #efe5d5;
}

.avatar-fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	color: #7b6044;
	font-size: 34rpx;
	font-weight: 700;
}

.contact-main {
	flex: 1;
	min-width: 0;
}

.contact-top,
.contact-preview-row,
.chat-head,
.composer-foot {
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.contact-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #2d241c;
}

.contact-preview-row {
	margin-top: 10rpx;
	justify-content: flex-start;
}

.preview-tag,
.bubble-type,
.type-chip,
.quota-badge {
	font-size: 22rpx;
}

.preview-tag,
.bubble-type {
	padding: 6rpx 14rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
}

.normal-tag {
	background: #efe5d3;
	color: #6d4e2c;
}

.heart-tag {
	background: #fde8e6;
	color: #b5483f;
}

.contact-preview {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chat-head {
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #eadfce;
}

.message-scroll {
	height: 720rpx;
	margin-top: 24rpx;
	padding: 8rpx 0;
}

.message-list {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.message-row {
	flex-direction: column;
}

.message-row.mine {
	align-items: flex-end;
}

.message-row.other {
	align-items: flex-start;
}

.bubble-meta {
	display: flex;
	gap: 12rpx;
	margin-bottom: 8rpx;
}

.bubble-wrap {
	flex-direction: column;
	align-items: flex-start;
	gap: 8rpx;
	max-width: 86%;
}

.message-row.mine .bubble-wrap {
	align-items: flex-end;
}

.bubble {
	padding: 20rpx 22rpx;
	border-radius: 24rpx;
	background: #f3eadb;
}

.message-row.mine .bubble {
	background: #dff4e8;
}

.bubble-text {
	font-size: 28rpx;
	line-height: 1.7;
	color: #2f251d;
	word-break: break-word;
}

.composer {
	margin-top: 24rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid #eadfce;
}

.type-chip {
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	background: #f3ede1;
	color: #7d6546;
}

.type-chip.active {
	background: #2d654f;
	color: #ffffff;
}

.type-chip.active.heart-chip {
	background: #b5483f;
}

.composer-input {
	min-height: 180rpx;
	margin-top: 20rpx;
	padding: 20rpx 24rpx;
	line-height: 1.7;
}

.composer-foot {
	margin-top: 18rpx;
}

.composer-tip {
	flex: 1;
}

.empty-box {
	padding: 48rpx 24rpx;
	text-align: center;
	font-size: 26rpx;
	color: #857362;
}

.small-empty {
	padding-top: 120rpx;
}

@media screen and (max-width: 420px) {
	.hero-stats,
	.type-row,
	.composer-foot {
		flex-direction: column;
		align-items: stretch;
	}

	.search-actions {
		justify-content: stretch;
	}

	.solid-btn,
	.light-btn {
		margin: 12rpx 0 0;
	}
}
</style>
