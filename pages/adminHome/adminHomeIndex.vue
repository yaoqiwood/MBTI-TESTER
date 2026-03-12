<template>
	<view class="page">
		<view v-if="!showFormOnly" class="hero-card">
			<view class="hero-copy">
				<text class="hero-kicker">MBTI PERSONNEL ADMIN</text>
				<text class="hero-title">后台人员信息录入</text>
				<text class="hero-desc"
					>首页已切换为管理录入页，原 MBTI 首页仍然保留，可从这里直接进入。</text
				>
			</view>
			<view class="hero-actions">
				<button class="solid-btn" @click="importSignupSheet">报名表格导入</button>
				<button class="ghost-btn" @click="goLegacyHome">原 MBTI 首页</button>
			</view>
		</view>

		<view class="stats-wrap">
			<view class="stat-card">
				<text class="stat-label">总人数</text>
				<text class="stat-value">{{ stats.total }}</text>
			</view>
			<view class="stat-card">
				<text class="stat-label">待审核</text>
				<text class="stat-value">{{ stats.pending }}</text>
			</view>
			<view class="stat-card">
				<text class="stat-label">已通过</text>
				<text class="stat-value">{{ stats.approved }}</text>
			</view>
			<view class="stat-card">
				<text class="stat-label">已驳回</text>
				<text class="stat-value">{{ stats.rejected }}</text>
			</view>
		</view>

		<view class="filter-card">
			<view v-if="!showFormOnly">
			<scroll-view class="status-scroll" scroll-x>
				<view class="status-row">
					<view
						v-for="item in reviewStatusFilters"
						:key="item.value"
						class="status-chip"
						:class="reviewStatusFilter === item.value ? 'status-chip active' : 'status-chip'"
						@click="changeStatusFilter(item.value)"
					>
						{{ item.label }}
					</view>
				</view>
			</scroll-view>
			<input
				v-model="keyword"
				class="search-input"
				placeholder="搜索编号 / 昵称 / 姓名 / 手机 / MBTI"
				confirm-type="search"
				@confirm="searchList"
			/>

			</view>
			<view class="filter-toolbar">
				<button v-if="!showFormOnly" class="solid-btn" @click="openCreate">新增人员</button>
				<button v-else class="ghost-btn" @click="exitFormMode">返回列表</button>
				<view v-if="!showFormOnly" class="filter-actions">
					<button class="light-btn" @click="resetFilters">重置</button>
					<button class="solid-btn" @click="searchList">查询</button>
				</view>
			</view>
		</view>

		<view v-if="!showFormOnly" class="table-card">
			<view class="card-head">
				<text class="card-title">人员信息表</text>
				<text class="card-tip">小程序端使用横向滚动表格，避免字段过多时布局挤压。</text>
			</view>
			<scroll-view scroll-x class="table-scroll">
				<view class="table">
					<view class="table-header table-row">
						<text class="col col-id">编号</text>
						<text class="col col-name">昵称 / 姓名</text>
						<text class="col col-gender">性别</text>
						<text class="col col-age">年龄</text>
						<text class="col col-mobile">手机号</text>
						<text class="col col-mbti">MBTI</text>
						<text class="col col-status">审核状态</text>
						<text class="col col-reviewer">审核人</text>
						<text class="col col-time">提交时间</text>
						<text class="col col-action">操作</text>
					</view>
					<view v-if="!loading && !records.length" class="empty-box">
						<text>暂无数据</text>
					</view>
					<view v-for="item in records" :key="item._id" class="table-row body-row">
						<text class="col col-id">#{{ item.person_id }}</text>
						<view class="col col-name name-cell">
							<text class="primary-text">{{ item.nickname || '-' }}</text>
							<text class="secondary-text">{{ item.name || '-' }}</text>
						</view>
						<text class="col col-gender">{{ item.gender || '-' }}</text>
						<text class="col col-age">{{ item.age || '-' }}</text>
						<text class="col col-mobile">{{ item.mobile || '-' }}</text>
						<text class="col col-mbti">{{ item.mbti || '-' }}</text>
						<view class="col col-status">
							<text :class="statusClass(item.review_status)">{{
								reviewStatusText(item.review_status)
							}}</text>
						</view>
						<text class="col col-reviewer">{{ item.reviewer || '-' }}</text>
						<text class="col col-time">{{ formatDate(item.submitted_at) }}</text>
						<view class="col col-action action-cell">
							<button class="mini-btn" @click="openEdit(item)">编辑</button>
						</view>
					</view>
				</view>
			</scroll-view>
			<view v-if="pagination.total" class="pagination-wrap">
				<uni-pagination
					show-icon
					:current="pagination.page"
					:page-size="pagination.pageSize"
					:total="pagination.total"
					@change="onPageChange"
				/>
			</view>
		</view>

		<view v-if="showFormOnly" class="form-card">
			<view class="card-head">
				<text class="card-title">{{ isEditMode ? '编辑人员' : '新增人员' }}</text>
				<text class="card-tip">提交时间和修改时间由云端自动维护，自增编号由云对象分配。</text>
			</view>

			<view class="section-block">
				<text class="section-title">基础信息</text>
				<view class="form-grid">
					<view class="field">
						<text class="label">昵称</text>
						<input v-model="form.nickname" class="input" placeholder="请输入昵称" />
					</view>
					<view class="field">
						<text class="label">姓名</text>
						<input v-model="form.name" class="input" placeholder="请输入姓名" />
					</view>
					<view class="field">
						<text class="label">性别</text>
						<picker :range="genderOptions" :value="genderIndex" @change="onGenderChange">
							<view class="picker">{{ form.gender || '请选择性别' }}</view>
						</picker>
					</view>
					<view class="field">
						<text class="label">年龄</text>
						<input v-model="form.age" class="input" type="number" placeholder="请输入年龄" />
					</view>
					<view class="field">
						<text class="label">手机号</text>
						<input v-model="form.mobile" class="input" type="number" placeholder="请输入手机号" />
					</view>
					<view class="field">
						<text class="label">身份证号</text>
						<input v-model="form.id_card" class="input" placeholder="请输入身份证号" />
					</view>
					<view class="field">
						<text class="label">MBTI</text>
						<picker :range="mbtiOptions" :value="mbtiIndex" @change="onMbtiChange">
							<view class="picker">{{ form.mbti || '请选择 MBTI' }}</view>
						</picker>
					</view>
					<view class="field">
						<text class="label">籍贯</text>
						<input v-model="form.native_place" class="input" placeholder="请输入籍贯" />
					</view>
					<view class="field">
						<text class="label">职业</text>
						<input v-model="form.profession" class="input" placeholder="请输入职业" />
					</view>
					<view class="field field-full">
						<text class="label">住址</text>
						<input v-model="form.address" class="input" placeholder="请输入住址" />
					</view>
				</view>
			</view>

			<view class="section-block">
				<text class="section-title">照片与背景</text>
				<view class="photo-box">
					<image
						v-if="form.personal_photo"
						class="photo-preview"
						:src="form.personal_photo"
						mode="aspectFill"
					></image>
					<view v-else class="photo-placeholder">未上传照片</view>
					<view class="photo-actions">
						<button class="light-btn" @click="uploadPhoto">上传照片</button>
						<button class="ghost-btn" @click="clearPhoto">清空照片</button>
					</view>
				</view>
				<view class="form-grid">
					<view class="field field-full">
						<text class="label">家庭大致情况</text>
						<textarea
							v-model="form.family_overview"
							class="textarea"
							placeholder="请输入家庭大致情况"
						></textarea>
					</view>
					<view class="field">
						<text class="label">所在教会</text>
						<input v-model="form.church" class="input" placeholder="请输入所在教会" />
					</view>
					<view class="field">
						<text class="label">推荐人</text>
						<input v-model="form.referrer" class="input" placeholder="请输入推荐人" />
					</view>
					<view class="field field-full">
						<text class="label">自我介绍</text>
						<textarea
							v-model="form.self_introduction"
							class="textarea"
							placeholder="请输入自我介绍"
						></textarea>
					</view>
				</view>
			</view>

			<view class="section-block">
				<text class="section-title">审核信息</text>
				<view class="form-grid">
					<view class="field">
						<text class="label">感情情况</text>
						<picker
							:range="relationshipOptions"
							:value="relationshipIndex"
							@change="onRelationshipChange"
						>
							<view class="picker">{{ form.relationship_status || '请选择感情情况' }}</view>
						</picker>
					</view>
					<view class="field">
						<text class="label">活动出行方式</text>
						<picker
							:range="travelModeOptions"
							:value="travelModeIndex"
							@change="onTravelModeChange"
						>
							<view class="picker">{{ form.travel_mode || '请选择出行方式' }}</view>
						</picker>
					</view>
					<view class="field">
						<text class="label">当前审核状态</text>
						<picker
							:range="reviewStatusOptionLabels"
							:value="reviewStatusIndex"
							@change="onReviewStatusChange"
						>
							<view class="picker">{{ reviewStatusText(form.review_status) }}</view>
						</picker>
					</view>
					<view class="field">
						<text class="label">审核人</text>
						<input v-model="form.reviewer" class="input" placeholder="请输入审核人" />
					</view>
					<view class="field field-full">
						<text class="label">remark 说明</text>
						<textarea
							v-model="form.remark"
							class="textarea"
							placeholder="请输入备注说明"
						></textarea>
					</view>
				</view>
			</view>

			<view class="form-actions">
				<button class="ghost-btn action-btn" @click="resetForm">清空</button>
				<button class="solid-btn action-btn" @click="submitForm">
					{{ isEditMode ? '保存修改' : '提交录入' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	var personnelAdmin = null
	if (typeof uniCloud !== 'undefined' && uniCloud.importObject) {
		personnelAdmin = uniCloud.importObject('personnel-admin')
	}

	function createDefaultStats() {
		return {
			total: 0,
			pending: 0,
			approved: 0,
			rejected: 0
		}
	}

	function createForm() {
		return {
			nickname: '',
			name: '',
			gender: '',
			age: '',
			personal_photo: '',
			mobile: '',
			id_card: '',
			mbti: '',
			native_place: '',
			profession: '',
			address: '',
			family_overview: '',
			church: '',
			referrer: '',
			self_introduction: '',
			relationship_status: '',
			travel_mode: '',
			review_status: 'pending',
			reviewer: '',
			remark: ''
		}
	}

	export default {
		data: function () {
			return {
				loading: false,
				saving: false,
				importing: false,
				records: [],
				stats: createDefaultStats(),
			keyword: '',
			reviewStatusFilter: 'all',
			showFormOnly: false,
			pagination: {
					page: 1,
					pageSize: 5,
					total: 0
				},
				currentId: '',
				form: createForm(),
				genderOptions: ['男', '女', '未知'],
				mbtiOptions: [
					'INTJ',
					'INTP',
					'ENTJ',
					'ENTP',
					'INFJ',
					'INFP',
					'ENFJ',
					'ENFP',
					'ISTJ',
					'ISFJ',
					'ESTJ',
					'ESFJ',
					'ISTP',
					'ISFP',
					'ESTP',
					'ESFP'
				],
				relationshipOptions: ['单身', '恋爱中', '已婚', '离异', '其他'],
				travelModeOptions: ['步行', '公交', '地铁', '骑行', '自驾', '打车', '其他'],
				reviewStatusFilters: [
					{ label: '全部', value: 'all' },
					{ label: '待审核', value: 'pending' },
					{ label: '已通过', value: 'approved' },
					{ label: '已驳回', value: 'rejected' }
				]
			}
		},
		computed: {
			isEditMode: function () {
				return !!this.currentId
			},
			genderIndex: function () {
				var index = this.genderOptions.indexOf(this.form.gender)
				return index > -1 ? index : 0
			},
			mbtiIndex: function () {
				var index = this.mbtiOptions.indexOf(this.form.mbti)
				return index > -1 ? index : 0
			},
			relationshipIndex: function () {
				var index = this.relationshipOptions.indexOf(this.form.relationship_status)
				return index > -1 ? index : 0
			},
			travelModeIndex: function () {
				var index = this.travelModeOptions.indexOf(this.form.travel_mode)
				return index > -1 ? index : 0
			},
			reviewStatusOptionLabels: function () {
				return [
					this.reviewStatusFilters[1].label,
					this.reviewStatusFilters[2].label,
					this.reviewStatusFilters[3].label
				]
			},
			reviewStatusIndex: function () {
				var list = this.reviewStatusFilters.slice(1)
				var value = 0
				for (var i = 0; i < list.length; i++) {
					if (list[i].value === this.form.review_status) {
						value = i
						break
					}
				}
				return value
			}
		},
		onLoad: function () {
			this.loadList()
		},
		methods: {
			chooseImportFile: function () {
				return new Promise(function (resolve, reject) {
					var chooseFile = null
					if (typeof uni.chooseFile === 'function') {
						chooseFile = uni.chooseFile
					} else if (typeof wx !== 'undefined' && typeof wx.chooseMessageFile === 'function') {
						chooseFile = wx.chooseMessageFile
					}
					if (!chooseFile) {
						reject(new Error('当前环境不支持文件选择'))
						return
					}
					chooseFile({
						count: 1,
						type: 'file',
						extension: ['xlsx', 'xls', 'csv'],
						success: function (res) {
							var file = (res.tempFiles && res.tempFiles[0]) || null
							if (!file) {
								reject(new Error('未选择到有效文件'))
								return
							}
							resolve(file)
						},
						fail: function (error) {
							reject(error)
						}
					})
				})
			},
			importSignupSheet: async function () {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				if (this.importing) {
					return
				}
				try {
					var file = await this.chooseImportFile()
					var filePath = file.path || file.tempFilePath
					var fileName = file.name || ''
					if (!filePath) {
						throw new Error('未获取到导入文件路径')
					}
					this.importing = true
					uni.showLoading({
						title: '导入中',
						mask: true
					})
					var ext = (fileName.split('.').pop() || 'xlsx').toLowerCase()
					var uploadRes = await uniCloud.uploadFile({
						filePath: filePath,
						cloudPath:
							'mbti-import/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
					})
					var res = await personnelAdmin.importExcel({
						fileID: uploadRes.fileID
					})
					this.loadList({
						page: 1
					})
					uni.showModal({
						title: '导入完成',
						content:
							'成功导入 ' +
							res.importedCount +
							' 条；跳过 ' +
							res.skippedCount +
							' 条' +
							(res.errors && res.errors.length
								? '\n\n前几条跳过原因：\n' +
									res.errors
										.map(function (item) {
											return '第' + item.row + '行：' + item.message
										})
										.join('\n')
								: ''),
						showCancel: false
					})
				} catch (error) {
					if (error && error.errMsg && error.errMsg.indexOf('cancel') > -1) {
						return
					}
					uni.showModal({
						content: error.message || '报名表格导入失败',
						showCancel: false
					})
				} finally {
					this.importing = false
					uni.hideLoading()
				}
			},
			searchList: function () {
				this.loadList({
					page: 1
				})
			},
			onPageChange: function (event) {
				if (!event || !event.current || event.current === this.pagination.page) {
					return
				}
				this.loadList({
					page: event.current
				})
			},
			loadList: async function (options) {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				var nextPage =
					options && options.page ? Number(options.page) : Number(this.pagination.page || 1)
				this.loading = true
				try {
					var res = await personnelAdmin.list({
						keyword: this.keyword,
						reviewStatus: this.reviewStatusFilter,
						page: nextPage,
						pageSize: this.pagination.pageSize
					})
					this.records = res.list || []
					this.stats = res.stats || createDefaultStats()
					this.pagination = {
						page: res.page || nextPage,
						pageSize: res.pageSize || this.pagination.pageSize,
						total: res.total || 0
					}
				} catch (error) {
					uni.showModal({
						content: error.message || '列表加载失败',
						showCancel: false
					})
				} finally {
					this.loading = false
				}
			},
			openCreate: function () {
				this.showFormOnly = true
				this.currentId = ''
				this.form = createForm()
			},
			exitFormMode: function () {
				this.showFormOnly = false
				this.currentId = ''
				this.form = createForm()
			},
			openEdit: function (item) {
				this.showFormOnly = true
				this.currentId = item._id
				this.form = {
					nickname: item.nickname || '',
					name: item.name || '',
					gender: item.gender || '',
					age: item.age ? String(item.age) : '',
					personal_photo: item.personal_photo || '',
					mobile: item.mobile || '',
					id_card: item.id_card || '',
					mbti: item.mbti || '',
					native_place: item.native_place || '',
					profession: item.profession || '',
					address: item.address || '',
					family_overview: item.family_overview || '',
					church: item.church || '',
					referrer: item.referrer || '',
					self_introduction: item.self_introduction || '',
					relationship_status: item.relationship_status || '',
					travel_mode: item.travel_mode || '',
					review_status: item.review_status || 'pending',
					reviewer: item.reviewer || '',
					remark: item.remark || ''
				}
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 200
				})
			},
			resetForm: function () {
				this.currentId = ''
				this.form = createForm()
			},
			changeStatusFilter: function (value) {
				this.reviewStatusFilter = value
				this.searchList()
			},
			resetFilters: function () {
				this.keyword = ''
				this.reviewStatusFilter = 'all'
				this.searchList()
			},
			onGenderChange: function (event) {
				this.form.gender = this.genderOptions[event.detail.value]
			},
			onMbtiChange: function (event) {
				this.form.mbti = this.mbtiOptions[event.detail.value]
			},
			onRelationshipChange: function (event) {
				this.form.relationship_status = this.relationshipOptions[event.detail.value]
			},
			onTravelModeChange: function (event) {
				this.form.travel_mode = this.travelModeOptions[event.detail.value]
			},
			onReviewStatusChange: function (event) {
				this.form.review_status = this.reviewStatusFilters.slice(1)[event.detail.value].value
			},
			reviewStatusText: function (value) {
				for (var i = 0; i < this.reviewStatusFilters.length; i++) {
					if (this.reviewStatusFilters[i].value === value) {
						return this.reviewStatusFilters[i].label
					}
				}
				return '待审核'
			},
			statusClass: function (value) {
				return 'status-pill status-' + (value || 'pending')
			},
			formatDate: function (value) {
				if (!value) {
					return '-'
				}
				var date = new Date(value)
				if (Number.isNaN(date.getTime())) {
					return '-'
				}
				var year = date.getFullYear()
				var month = ('0' + (date.getMonth() + 1)).slice(-2)
				var day = ('0' + date.getDate()).slice(-2)
				var hour = ('0' + date.getHours()).slice(-2)
				var minute = ('0' + date.getMinutes()).slice(-2)
				return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
			},
			uploadPhoto: async function () {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				try {
					var chooseRes = await uni.chooseImage({
						count: 1,
						sizeType: ['compressed'],
						sourceType: ['album', 'camera']
					})
					var filePath = chooseRes.tempFilePaths[0]
					if (!filePath) {
						return
					}
					uni.showLoading({
						title: '上传中'
					})
					var ext = filePath.split('.').pop() || 'jpg'
					var uploadRes = await uniCloud.uploadFile({
						filePath: filePath,
						cloudPath:
							'mbti-personnel/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
					})
					this.form.personal_photo = uploadRes.fileID
				} catch (error) {
					if (error && error.errMsg && error.errMsg.indexOf('cancel') > -1) {
						return
					}
					uni.showModal({
						content: error.message || '照片上传失败',
						showCancel: false
					})
				} finally {
					uni.hideLoading()
				}
			},
			clearPhoto: function () {
				this.form.personal_photo = ''
			},
			validateForm: function () {
				if (!this.form.nickname.trim()) {
					return '昵称不能为空'
				}
				if (!this.form.name.trim()) {
					return '姓名不能为空'
				}
				if (this.form.mobile && !/^1\d{10}$/.test(this.form.mobile)) {
					return '手机号格式不正确'
				}
				if (this.form.id_card && !/(^\d{15}$)|(^\d{17}[\dXx]$)/.test(this.form.id_card)) {
					return '身份证号格式不正确'
				}
				if (this.form.mbti && !/^(E|I)(N|S)(T|F)(J|P)$/.test(this.form.mbti)) {
					return 'MBTI 格式不正确'
				}
				return ''
			},
			submitForm: async function () {
				if (!personnelAdmin) {
					this.showUnavailable()
					return
				}
				var isEditMode = this.isEditMode
				var errorMessage = this.validateForm()
				if (errorMessage) {
					uni.showToast({
						title: errorMessage,
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
					var payload = {
						nickname: this.form.nickname,
						name: this.form.name,
						gender: this.form.gender,
						age: this.form.age ? Number(this.form.age) : null,
						personal_photo: this.form.personal_photo,
						mobile: this.form.mobile,
						id_card: this.form.id_card,
						mbti: this.form.mbti,
						native_place: this.form.native_place,
						profession: this.form.profession,
						address: this.form.address,
						family_overview: this.form.family_overview,
						church: this.form.church,
						referrer: this.form.referrer,
						self_introduction: this.form.self_introduction,
						relationship_status: this.form.relationship_status,
						travel_mode: this.form.travel_mode,
						review_status: this.form.review_status,
						reviewer: this.form.reviewer,
						remark: this.form.remark
					}
					if (this.isEditMode) {
						await personnelAdmin.update({
							id: this.currentId,
							data: payload
						})
					} else {
						await personnelAdmin.create({
							data: payload
						})
					}
					uni.showToast({
						title: isEditMode ? '修改成功' : '提交成功',
						icon: 'success'
					})
					this.exitFormMode()
					this.loadList({
						page: isEditMode ? this.pagination.page : 1
					})
				} catch (error) {
					uni.showModal({
						content: error.message || '保存失败',
						showCancel: false
					})
				} finally {
					this.saving = false
					uni.hideLoading()
				}
			},
			goLegacyHome: function () {
				uni.navigateTo({
					url: '/pages/mbti-home/home'
				})
			},
			showUnavailable: function () {
				uni.showModal({
					content: '当前环境未启用 uniCloud 云对象，请先绑定并部署云空间。',
					showCancel: false
				})
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
	.filter-card,
	.table-card,
	.form-card,
	.stat-card {
		background: #fffcf7;
		border: 1rpx solid #eadfce;
		border-radius: 28rpx;
		box-shadow: 0 18rpx 40rpx rgba(91, 70, 40, 0.08);
	}

	.hero-card {
		padding: 32rpx;
	}

	.hero-copy,
	.card-head,
	.field,
	.name-cell,
	.action-cell,
	.photo-box {
		display: flex;
		flex-direction: column;
	}

	.hero-kicker {
		font-size: 22rpx;
		letter-spacing: 4rpx;
		color: #8f6840;
	}

	.hero-title {
		margin-top: 16rpx;
		font-size: 44rpx;
		font-weight: 700;
		color: #2c241c;
		line-height: 1.24;
	}

	.hero-desc,
	.card-tip {
		margin-top: 16rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #716250;
	}

	.hero-actions,
	.filter-actions,
	.filter-toolbar,
	.photo-actions,
	.form-actions {
		display: flex;
		flex-wrap: wrap;
		margin-top: 24rpx;
	}

	.filter-toolbar {
		justify-content: space-between;
		align-items: center;
	}

	.solid-btn,
	.ghost-btn,
	.light-btn,
	.mini-btn,
	.action-btn {
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
	}

	.stats-wrap {
		display: flex;
		flex-wrap: wrap;
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

	.filter-card,
	.table-card,
	.form-card {
		margin-top: 24rpx;
		padding: 28rpx;
	}

	.search-input,
	.input,
	.picker,
	.textarea {
		width: 100%;
		background: #fbf8f2;
		border: 1rpx solid #dfd3c1;
		border-radius: 20rpx;
		box-sizing: border-box;
		color: #342b22;
		font-size: 26rpx;
	}

	.search-input,
	.input,
	.picker {
		height: 84rpx;
		padding: 0 24rpx;
		line-height: 84rpx;
	}

	.status-scroll {
		margin-top: 20rpx;
		position: relative;
		bottom: 20rpx;
		white-space: nowrap;
	}

	.status-row {
		display: inline-flex;
		padding-bottom: 8rpx;
	}

	.status-chip {
		padding: 18rpx 28rpx;
		margin-right: 16rpx;
		border-radius: 999rpx;
		background: #f3ede1;
		color: #7d6546;
		font-size: 24rpx;
	}

	.status-chip.active {
		background: #2d654f;
		color: #ffffff;
	}

	.filter-actions {
		justify-content: flex-end;
		margin-top: 0;
	}

	.card-title,
	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #2d241c;
	}

	.table-scroll {
		width: 100%;
		margin-top: 24rpx;
	}

	.table {
		min-width: 1380rpx;
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

	.col-id {
		width: 120rpx;
	}
	.col-name {
		width: 220rpx;
	}
	.col-gender,
	.col-age {
		width: 110rpx;
	}
	.col-mobile {
		width: 210rpx;
	}
	.col-mbti {
		width: 120rpx;
	}
	.col-status {
		width: 150rpx;
	}
	.col-reviewer {
		width: 160rpx;
	}
	.col-time {
		width: 220rpx;
	}
	.col-action {
		width: 130rpx;
	}

	.name-cell,
	.action-cell {
		justify-content: center;
	}

	.primary-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #2f251d;
	}

	.secondary-text {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #7a6a58;
	}

	.status-pill {
		display: inline-block;
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.status-pending {
		background: #fff1cc;
		color: #8e6400;
	}

	.status-approved {
		background: #dff4e8;
		color: #1e6b45;
	}

	.status-rejected {
		background: #fde2df;
		color: #a44239;
	}

	.empty-box {
		padding: 44rpx 24rpx;
		font-size: 26rpx;
		color: #857362;
		text-align: center;
	}

	.pagination-wrap {
		display: flex;
		justify-content: flex-end;
		margin-top: 24rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid #eadfce;
	}

	.section-block {
		margin-top: 24rpx;
		padding: 24rpx;
		background: #fffaf3;
		border-radius: 24rpx;
		border: 1rpx solid #eadfce;
	}

	.form-grid {
		margin-top: 20rpx;
	}

	.field {
		width: 100%;
		margin-bottom: 20rpx;
	}

	.field-full {
		width: 100%;
	}

	.label {
		margin-bottom: 12rpx;
		font-size: 24rpx;
		color: #755f45;
	}

	.textarea {
		min-height: 180rpx;
		padding: 20rpx 24rpx;
		line-height: 1.7;
	}

	.photo-preview,
	.photo-placeholder {
		width: 220rpx;
		height: 220rpx;
		border-radius: 24rpx;
	}

	.photo-preview {
		background: #efe5d5;
	}

	.photo-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f6eee1;
		color: #90785c;
		font-size: 24rpx;
	}

	.action-btn {
		min-width: 200rpx;
	}
</style>
