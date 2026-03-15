<template>
	<view class="page">
		<view class="hero">
			<view class="hero-backdrop hero-backdrop-left"></view>
			<view class="hero-backdrop hero-backdrop-right"></view>

			<view class="hero-copy">
				<text class="eyebrow">LOVE MBTI LAB</text>
				<text class="headline">{{ pageTitle }}</text>
				<text class="subhead">{{ pageSubtitle }}</text>
			</view>

			<view class="progress-card">
				<view class="progress-meta">
					<text class="progress-title">绛旈杩涘害</text>
					<text class="progress-count">{{ answeredCount }}/{{ totalQuestions }}</text>
				</view>
				<view class="progress-track">
					<view class="progress-fill" :style="{ width: `${progressPercent}%` }"></view>
				</view>
				<view class="stage-row">
					<view
						v-for="(stage, index) in stageList"
						:key="stage.label"
						class="stage-pill"
						:class="getStageClass(index)"
					>
						<text class="stage-index">{{ formatStageIndex(index + 1) }}</text>
						<text class="stage-label">{{ stage.label }}</text>
					</view>
				</view>
			</view>

			<view v-if="showStageSummary" class="summary-card">
				<text class="card-eyebrow">STAGE CHECKPOINT</text>
				<text class="summary-title">{{ stageSummary.title }}</text>
				<text class="summary-copy">{{ stageSummary.description }}</text>

				<view class="summary-portrait">
					<text class="summary-portrait-label">闃舵鐢诲儚</text>
					<text class="summary-portrait-copy">{{ stageSummary.personalityDescription }}</text>
				</view>

				<view class="summary-chip-row">
					<view v-for="item in stageSummary.badges" :key="item" class="summary-chip">
						<text>{{ item }}</text>
					</view>
				</view>

				<text class="summary-encourage">{{ stageSummary.encouragement }}</text>

				<view class="action-btn primary-btn" @click="continueToNextStage">
					<text>{{ pendingStageNumber === stageList.length ? '鏌ョ湅鏈€缁堢粨鏋? : '缁х画绛旈' }}</text>
				</view>
			</view>

			<view v-else-if="showResult" class="result-card">
				<text class="card-eyebrow">FINAL RESULT</text>
				<text class="result-type">{{ resultType }}</text>
				<text class="result-copy">{{ resultSummary }}</text>

				<view class="result-chip-row">
					<view v-for="item in resultKeywords" :key="item" class="summary-chip accent-chip">
						<text>{{ item }}</text>
					</view>
				</view>

				<view class="trait-list">
					<view v-for="trait in resultTraits" :key="trait.axis" class="trait-item">
						<view class="trait-meta">
							<text class="trait-axis">{{ trait.axis }}</text>
							<text class="trait-score">{{ trait.leftCount }} : {{ trait.rightCount }}</text>
						</view>
						<view class="trait-track">
							<view class="trait-half trait-left"></view>
							<view class="trait-half trait-right"></view>
							<view
								class="trait-fill"
								:class="trait.dominant === trait.right ? 'fill-right' : 'fill-left'"
								:style="{ width: `${trait.fillWidth}%` }"
							></view>
						</view>
						<text class="trait-note"
							>鏇村亸鍚?{{ trait.dominant }} 路 {{ trait.dominantPercent }}%</text
						>
					</view>
				</view>

				<view class="result-actions">
					<view class="action-btn ghost-btn" @click="goHome">
						<text>杩斿洖棣栭〉</text>
					</view>
				</view>
			</view>

			<view v-else class="question-card" :class="{ locked: isTransitioning }">
				<view class="question-meta">
					<text class="question-index">Q{{ currentIndex + 1 }}</text>
					<!-- <text class="question-type">{{ currentQuestion.type }} 缁村害</text> -->
				</view>

				<text class="question-title">{{ currentQuestion.title }}</text>
				<text class="question-caption">閫夋嫨鏇存帴杩戜綘鐪熷疄鐘舵€佺殑涓€椤?/text>

				<view class="option-list">
					<view
						v-for="option in currentQuestion.selections"
						:key="`${currentQuestion.id}-${option.dimension}`"
						class="option-card"
						:class="{ selected: selectedDimension === option.dimension }"
						@click="selectOption(option)"
					>
						<view class="option-head">
							<!-- <text class="option-dimension">{{ option.dimension }}</text> -->
							<!-- <text class="option-tip">鐐瑰嚮閫夋嫨</text> -->
						</view>
						<text class="option-text">{{ option.text }}</text>
					</view>
				</view>

				<view class="feedback-panel">
					<text class="feedback-title">{{ liveHintTitle }}</text>
					<text class="feedback-copy">{{ liveHintCopy }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { computed, reactive, ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import questionsSource from '../../static/json/mbti-88-questions.json'
	const personnelAdmin = uniCloud.importObject('personnel-admin')

	const questions = questionsSource.questions || []
	const totalQuestions = questions.length
	const stageSize = totalQuestions / 4

	const stageList = [
		{
			label: '鍒濆鎰熺煡',
			start: 0,
			end: stageSize,
			prompt: '鍏堟寜绗竴鐩磋浣滅瓟锛屽埆鑺卞お涔呯姽璞€?,
			encouragement: '浣犲凡缁忓畬鎴愮儹韬樁娈碉紝缁х画绛旈锛岃疆寤撲細鏇存竻鏅般€?
		},
		{
			label: '鍏崇郴绾跨储',
			start: stageSize,
			end: stageSize * 2,
			prompt: '杩欎竴娈典細鏇存槑鏄惧湴鎷夊紑浣犵殑鍏崇郴鍋忓ソ銆?,
			encouragement: '浣犵殑鍋忓ソ宸茬粡寮€濮嬬ǔ瀹氾紝缁х画鎶婄粏鑺傝ˉ瀹屾暣銆?
		},
		{
			label: '鍐崇瓥鍊惧悜',
			start: stageSize * 2,
			end: stageSize * 3,
			prompt: '缁х画淇濇寔鐪熷疄閫夋嫨锛屽埆鎸夌悊鎯充腑鐨勮嚜宸卞幓绛斻€?,
			encouragement: '杩樺樊鏈€鍚庝竴涓樁娈碉紝浣犵殑缁撴灉宸茬粡寰堟帴杩戞垚鍨嬨€?
		},
		{
			label: '鑺傚瀹氬瀷',
			start: stageSize * 3,
			end: totalQuestions,
			prompt: '鏈€鍚庝竴娈典細鍐冲畾浣犲湪鍏崇郴鑺傚涓殑鏁翠綋璧板悜銆?,
			encouragement: '鍥涗釜闃舵閮藉凡瀹屾垚锛屼笅涓€姝ュ氨鑳界湅鍒板畬鏁存祴璇曠粨鏋溿€?
		}
	]

	const axisPairs = [
		{
			left: 'E',
			right: 'I',
			label: '绀句氦鑳介噺',
			badgeLeft: '鏇存効鎰忎富鍔ㄨ〃杈?,
			badgeRight: '鏇村亸鍚戞參鐑瀵?,
			sentenceLeft: '鏇存効鎰忓厛鎵撳紑璇濋銆佸甫鍔ㄤ簰鍔?,
			sentenceRight: '鏇村亸鍚戝厛瑙傚療姘旀皼锛屽湪鑸掓湇鐨勮妭濂忛噷鎱㈡參闈犺繎'
		},
		{
			left: 'S',
			right: 'N',
			label: '鍏虫敞閲嶇偣',
			badgeLeft: '鏇寸湅閲嶇幇瀹炵粏鑺?,
			badgeRight: '鏇村鏄撶暀鎰忔湭鏉ュ彲鑳?,
			sentenceLeft: '鏇村鏄撹鐪熷疄銆佺ǔ瀹氥€佽兘钀藉湴鐨勭粏鑺傛墦鍔?,
			sentenceRight: '鏇村鏄撹鎯虫硶銆佹綔鍔涘拰鏈潵鎰熷惛寮?
		},
		{
			left: 'T',
			right: 'F',
			label: '鍒ゆ柇鏂瑰紡',
			badgeLeft: '浼氬厛鐞嗘竻閫昏緫',
			badgeRight: '浼氬厛鐓ч【鎰熷彈',
			sentenceLeft: '閬囧埌鍒嗘鏃朵細鍏堟⒊鐞嗛棶棰樻湰韬拰瑙ｅ喅璺緞',
			sentenceRight: '閬囧埌鍒嗘鏃朵細鍏堟劅鍙楀郊姝ゆ湁娌℃湁琚悊瑙ｅ拰鎺ヤ綇'
		},
		{
			left: 'J',
			right: 'P',
			label: '鐩稿鑺傚',
			badgeLeft: '鏇村笇鏈涚ǔ瀹氭帹杩?,
			badgeRight: '鏇村笇鏈涗繚鐣欏脊鎬?,
			sentenceLeft: '鍦ㄥ叧绯绘帹杩涗笂鏇村枩娆㈡竻鏅般€佺ǔ瀹氥€佹參鎱㈣惤鍦?,
			sentenceRight: '鍦ㄥ叧绯绘帹杩涗笂鏇村笇鏈涗繚鐣欑┖闂达紝璁╀簰鍔ㄨ嚜鐒剁敓闀?
		}
	]

	const dimensionKeywords = {
		E: '澶栧悜琛ㄨ揪',
		I: '鍐呭悜娌夋穩',
		S: '鐜板疄鎰熺煡',
		N: '鏈潵鎯宠薄',
		T: '鐞嗘€у垽鏂?,
		F: '鎯呮劅鍒ゆ柇',
		J: '瑙勫垝鑺傚',
		P: '寮€鏀捐妭濂?
	}

	const typeHeadlines = {
		INTJ: '浣犱細鍏堢湅鏁翠綋鏂瑰悜锛屽啀鍐冲畾鍏崇郴瑕佷笉瑕佺户缁姇鍏ャ€?,
		INTP: '浣犲湪鍏崇郴閲屽緢閲嶈绮剧浜ゆ祦鍜岃嚜鐢辩┖闂淬€?,
		ENTJ: '浣犲€惧悜涓诲姩鎺ㄥ姩鍏崇郴鍚戞洿鏄庣‘鐨勬柟鍚戝彂灞曘€?,
		ENTP: '浣犲鏄撹鏂伴矞鎰熴€佹€濇兂纰版挒鍜屽彲鑳芥€у惛寮曘€?,
		INFJ: '浣犱細璁ょ湡鎰熷彈杩炴帴娣卞害锛屼篃鍦ㄦ剰鍏崇郴鐨勯暱鏈熸剰涔夈€?,
		INFP: '浣犻渶瑕佺湡璇氥€佸叡楦ｅ拰涓嶈鎵撴壈鐨勬儏鎰熺┖闂淬€?,
		ENFJ: '浣犳搮闀跨粡钀ユ皼鍥达紝涔熸効鎰忎富鍔ㄧ収椤惧叧绯绘俯搴︺€?,
		ENFP: '浣犱細涓哄績鍔ㄥ拰鍙兘鎬ф姇鍏ュ緢澶氱儹鎯呫€?,
		ISTJ: '浣犳洿閲嶈鍙潬銆佺ǔ瀹氬拰鍙互钀藉湴鐨勯櫔浼淬€?,
		ISFJ: '浣犲€惧悜鐢ㄤ綋璐村拰鎸佺画鎶曞叆鏉ョ淮绯诲叧绯汇€?,
		ESTJ: '浣犱範鎯妸鍏崇郴鎺ㄨ繘寰楁洿鏈夌З搴忓拰纭畾鎰熴€?,
		ESFJ: '浣犱細涓诲姩钀ラ€犲畨蹇冦€佹俯鏆栥€佸彲鍥炲簲鐨勫叧绯讳綋楠屻€?,
		ISTP: '浣犳洿鍋忓ソ杞绘澗銆佺湡瀹炪€佷笉杩囧害鏉熺細鐨勪簰鍔ㄦ柟寮忋€?,
		ISFP: '浣犲湪鍏崇郴閲屽緢閲嶈鎰熷彈鏄惁鑷劧鑸掓湇銆?,
		ESTP: '浣犱細琚嵆鏃朵簰鍔ㄣ€佽鍔ㄥ姏鍜岀湡瀹炰綋楠屽惛寮曘€?,
		ESFP: '浣犳搮闀垮埗閫犺交鏉惧揩涔愮殑姘涘洿锛屼篃閲嶈褰撲笅鎰熷彈銆?
	}

	const letterCopy = {
		E: '浣犻€氬父閫氳繃浜掑姩纭鍏崇郴娓╁害锛屼氦娴佹湰韬細缁欎綘鍙嶉銆?,
		I: '浣犳洿闇€瑕佺ǔ瀹氥€佽垝鏈嶃€佷綆鍘嬪姏鐨勭浉澶勮妭濂忥紝娣卞叆姣旂儹闂规洿閲嶈銆?,
		S: '浣犱細浼樺厛鐪嬭鐜板疄閲岀殑鍙潬銆佺粏鑺傚拰鍙寔缁€с€?,
		N: '浣犳洿瀹规槗琚兂娉曘€佹効鏅€佹綔鍔涘拰鏈潵鎰熸墦鍔ㄣ€?,
		T: '浣犲鐞嗗叧绯婚棶棰樻椂浼氬厛鐞嗘竻閫昏緫銆佽竟鐣屽拰瑙ｅ喅璺緞銆?,
		F: '浣犱細浼樺厛鍒ゆ柇褰兼鐨勬劅鍙楁槸鍚﹁鐪嬭銆佽鎺ヤ綇銆?,
		J: '浣犲枩娆㈠叧绯绘湞鏇存槑纭€佹洿绋冲畾銆佹洿鏈夎鍒掔殑鏂瑰悜鎺ㄨ繘銆?,
		P: '浣犳洿甯屾湜鍏崇郴淇濈暀寮规€э紝璁╀簰鍔ㄨ嚜鐒剁敓闀裤€?
	}

	const feedbackMap = {
		E: '璁板綍浜嗘洿涓诲姩澶栨斁鐨勪竴闈紝缁х画淇濇寔鐩磋浣滅瓟銆?,
		I: '璁板綍浜嗘洿鍐呮暃娌夐潤鐨勪竴闈紝绋冲畾鍋忓ソ姝ｅ湪绱Н銆?,
		S: '璁板綍浜嗘洿鐜板疄钀藉湴鐨勫亸濂斤紝杩欎細璁╃粨鏋滄洿鎵庡疄銆?,
		N: '璁板綍浜嗘洿鍋忔湭鏉ユ劅鍜屾兂璞″姏鐨勪竴闈紝杞粨鏇撮矞鏄庝簡銆?,
		T: '璁板綍浜嗘洿鐞嗘€х殑鍒ゆ柇鏂瑰紡锛岀粨鏋滄鍦ㄦ敹鏉熴€?,
		F: '璁板綍浜嗘洿鎰熷彈瀵煎悜鐨勪竴闈紝鍏崇郴娓╁害绾跨储鏇存竻妤氫簡銆?,
		J: '璁板綍浜嗘洿鍋忚鍒掑拰纭畾鎰熺殑鍊惧悜锛岃妭濂忔劅鏇寸ǔ瀹氫簡銆?,
		P: '璁板綍浜嗘洿鍋忓紑鏀惧拰鐏垫椿鐨勫€惧悜锛岄鏍煎紑濮嬫樉鐜般€?
	}

	const userName = ref('')
	const personnelId = ref('')
	const currentIndex = ref(0)
	const answers = ref([])
	const questionFlow = ref(buildQuestionFlow())
	const showStageSummary = ref(false)
	const showResult = ref(false)
	const pendingStageNumber = ref(0)
	const selectedDimension = ref('')
	const latestFeedback = ref('')
	const isTransitioning = ref(false)
	const isSavingResult = ref(false)

	const dimensionScores = reactive({
		E: 0,
		I: 0,
		S: 0,
		N: 0,
		T: 0,
		F: 0,
		J: 0,
		P: 0
	})

	onLoad((options) => {
		if (options && options.name) {
			userName.value = decodeURIComponent(options.name)
		}
		if (options && options.personnelId) {
			personnelId.value = decodeURIComponent(options.personnelId)
		}
	})

	const answeredCount = computed(() => answers.value.length)
	const progressPercent = computed(() => Math.round((answeredCount.value / totalQuestions) * 100))
	const currentQuestion = computed(
		() =>
			questionFlow.value[currentIndex.value] || questionFlow.value[questionFlow.value.length - 1]
	)
	const currentStageIndex = computed(() => {
		if (answeredCount.value >= totalQuestions) {
			return stageList.length - 1
		}
		return Math.min(stageList.length - 1, Math.floor(currentIndex.value / stageSize))
	})

	const pageTitle = computed(() => {
		if (showResult.value) {
			return '浣犵殑鎭嬬埍 MBTI'
		}
		if (showStageSummary.value) {
			return '闃舵灏忕粨'
		}
		return userName.value ? `${userName.value} 鐨勬祴璇曚腑` : '鎭嬬埍 MBTI 娴嬭瘯'
	})

	const pageSubtitle = computed(() => {
		if (showResult.value) {
			return '鍥涗釜闃舵宸茬粡鍏ㄩ儴瀹屾垚锛岀幇鍦ㄧ湅鐪嬩綘鐨勫叧绯诲亸濂借疆寤撱€?
		}
		if (showStageSummary.value) {
			return '姣忓畬鎴愬洓鍒嗕箣涓€棰橀噺閮戒細鐢熸垚涓€娆￠樁娈靛弽棣堬紝鏂逛究浣犳劅鍙楄嚜宸辩殑鍋忓ソ璧板悜銆?
		}
		const currentStage = stageList[currentStageIndex.value]
		return `${currentStage.label} 路 绗?${(currentIndex.value % stageSize) + 1} / ${stageSize} 棰橈紝${currentStage.prompt}`
	})

	const liveHintTitle = computed(() => {
		if (selectedDimension.value) {
			return `宸茶褰曪細${selectedDimension.value}`
		}
		return `${stageList[currentStageIndex.value].label} 路 宸插畬鎴?${answeredCount.value} / ${totalQuestions}`
	})

	const liveHintCopy = computed(() => {
		if (selectedDimension.value) {
			return latestFeedback.value
		}
		return stageList[currentStageIndex.value].prompt
	})

	const resultType = computed(() => buildTypeFromCounts(dimensionScores))
	const resultKeywords = computed(() =>
		resultType.value.split('').map((letter) => dimensionKeywords[letter])
	)
	const resultSummary = computed(() => {
		const letters = resultType.value.split('')
		const intro = userName.value ? `${userName.value}锛宍 : ''
		return `${intro}${typeHeadlines[resultType.value]} ${letters.map((letter) => letterCopy[letter]).join(' ')}`
	})

	const resultTraits = computed(() =>
		axisPairs.map((pair) => {
			const leftCount = dimensionScores[pair.left]
			const rightCount = dimensionScores[pair.right]
			const total = leftCount + rightCount || 1
			const dominant = leftCount >= rightCount ? pair.left : pair.right
			const dominantCount = Math.max(leftCount, rightCount)
			return {
				axis: `${pair.left} / ${pair.right}`,
				left: pair.left,
				right: pair.right,
				leftCount,
				rightCount,
				dominant,
				dominantPercent: Math.round((dominantCount / total) * 100),
				fillWidth: Math.max(16, Math.round((dominantCount / total) * 100))
			}
		})
	)

	const stageSummary = computed(() => {
		const stage = stageList[pendingStageNumber.value - 1] || stageList[0]
		const cumulativeAnswers = answers.value.slice(0, stage.end)
		const cumulativeCounts = countDimensions(cumulativeAnswers)
		return {
			title: `${stage.label}瀹屾垚`,
			description: `${userName.value ? `${userName.value}锛宍 : ''}浣犲凡缁忓畬鎴?${stage.end} / ${totalQuestions} 棰橈紝杩欎竴闃舵鍛堢幇鍑虹殑鎬ф牸鍊惧悜宸茬粡瓒婃潵瓒婃竻妤氥€俙,
			personalityDescription: buildStagePersonalityDescription(cumulativeCounts),
			badges: axisPairs.map((pair) => `${pair.label}锛?{getAxisBadgeText(cumulativeCounts, pair)}`),
			encouragement: stage.encouragement
		}
	})

	function formatStageIndex(index) {
		return String(index).padStart(2, '0')
	}

	function getStageClass(index) {
		return {
			done: answeredCount.value >= stageList[index].end,
			active:
				index === currentStageIndex.value &&
				!showStageSummary.value &&
				!showResult.value &&
				answeredCount.value < totalQuestions,
			upcoming: answeredCount.value < stageList[index].start
		}
	}

	function countDimensions(list) {
		return list.reduce(
			(acc, item) => {
				acc[item.dimension] += 1
				return acc
			},
			{
				E: 0,
				I: 0,
				S: 0,
				N: 0,
				T: 0,
				F: 0,
				J: 0,
				P: 0
			}
		)
	}

	function shuffleList(list) {
		const cloned = [...list]
		for (let index = cloned.length - 1; index > 0; index -= 1) {
			const randomIndex = Math.floor(Math.random() * (index + 1))
			;[cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]]
		}
		return cloned
	}

	function buildQuestionFlow() {
		const flow = []
		const seenQuestionIds = new Set()
		for (let stageIndex = 0; stageIndex < stageList.length; stageIndex += 1) {
			const start = stageIndex * stageSize
			const stageQuestions = questions.slice(start, start + stageSize)
			const shuffledStageQuestions = shuffleList(stageQuestions).filter((question) => {
				if (!question || seenQuestionIds.has(question.id)) {
					return false
				}
				seenQuestionIds.add(question.id)
				return true
			})
			flow.push(...shuffledStageQuestions)
		}

		if (flow.length !== totalQuestions) {
			const remainingQuestions = questions.filter((question) => {
				if (!question || seenQuestionIds.has(question.id)) {
					return false
				}
				seenQuestionIds.add(question.id)
				return true
			})
			flow.push(...remainingQuestions)
		}

		return flow.slice(0, totalQuestions)
	}

	function buildTypeFromCounts(counts) {
		return axisPairs
			.map((pair) => (counts[pair.left] >= counts[pair.right] ? pair.left : pair.right))
			.join('')
	}

	function getAxisBadgeText(counts, pair) {
		return counts[pair.left] >= counts[pair.right] ? pair.badgeLeft : pair.badgeRight
	}

	function buildStagePersonalityDescription(counts) {
		const social = counts.E >= counts.I ? axisPairs[0].sentenceLeft : axisPairs[0].sentenceRight
		const focus = counts.S >= counts.N ? axisPairs[1].sentenceLeft : axisPairs[1].sentenceRight
		const decision = counts.T >= counts.F ? axisPairs[2].sentenceLeft : axisPairs[2].sentenceRight
		const rhythm = counts.J >= counts.P ? axisPairs[3].sentenceLeft : axisPairs[3].sentenceRight
		return `浣犲湪浜洪檯浜掑姩閲?{social}锛涘湪鍏虫敞涓€涓汉鎴栦竴娈靛叧绯绘椂锛?{focus}锛?{decision}锛涙暣浣撶浉澶勮妭濂忎笂锛?{rhythm}銆俙
	}

	function selectOption(option) {
		if (isTransitioning.value || showStageSummary.value || showResult.value) {
			return
		}

		const question = currentQuestion.value
		answers.value.push({
			questionId: question.id,
			type: question.type,
			dimension: option.dimension,
			text: option.text
		})
		dimensionScores[option.dimension] += 1
		selectedDimension.value = option.dimension
		latestFeedback.value = feedbackMap[option.dimension]
		isTransitioning.value = true

		setTimeout(() => {
			const nextAnsweredCount = answers.value.length
			const nextIndex = currentIndex.value + 1

			if (nextAnsweredCount % stageSize === 0) {
				if (nextAnsweredCount < totalQuestions) {
					currentIndex.value = nextIndex
				}
				pendingStageNumber.value = nextAnsweredCount / stageSize
				showStageSummary.value = true
			} else if (nextAnsweredCount < totalQuestions) {
				currentIndex.value = nextIndex
			}

			selectedDimension.value = ''
			isTransitioning.value = false
		}, 220)
	}

	async function continueToNextStage() {
		showStageSummary.value = false
		if (pendingStageNumber.value === stageList.length && answeredCount.value === totalQuestions) {
			await persistMbtiResult()
			showResult.value = true
			return
		}
		latestFeedback.value = ''
	}

	async function persistMbtiResult() {
		if (!personnelId.value || isSavingResult.value) {
			return
		}
		isSavingResult.value = true
		uni.showLoading({
			title: '淇濆瓨缁撴灉涓?,
			mask: true
		})
		try {
			await personnelAdmin.saveMbtiResult({
				id: personnelId.value,
				mbti: resultType.value
			})
		} catch (error) {
			uni.showToast({
				title: (error && error.message) || '缁撴灉淇濆瓨澶辫触',
				icon: 'none',
				duration: 3000
			})
		} finally {
			isSavingResult.value = false
			uni.hideLoading()
		}
	}


	function goHome() {
		uni.navigateTo({
			url: '/pages/mbti-home/home'
		})
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
	.progress-card,
	.question-card,
	.summary-card,
	.result-card {
		position: relative;
		z-index: 2;
	}

	.eyebrow,
	.card-eyebrow {
		display: block;
		font-size: 24rpx;
		letter-spacing: 6rpx;
		color: #8d5d41;
	}

	.headline {
		display: block;
		margin-top: 14rpx;
		font-size: 60rpx;
		line-height: 1.18;
		font-weight: 700;
		color: #2f211d;
	}

	.subhead {
		display: block;
		margin-top: 20rpx;
		font-size: 28rpx;
		line-height: 1.7;
		color: #6d5b56;
	}

	.progress-card,
	.question-card,
	.summary-card,
	.result-card {
		margin-top: 30rpx;
		padding: 32rpx 28rpx;
		border-radius: 36rpx;
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 20rpx 44rpx rgba(117, 88, 63, 0.1);
		backdrop-filter: blur(10rpx);
	}

	.progress-meta,
	.question-meta,
	.trait-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.progress-title,
	.summary-portrait-label,
	.question-index,
	.trait-axis {
		font-size: 26rpx;
		font-weight: 600;
		color: #49362f;
	}

	.progress-count,
	.question-type,
	.trait-score {
		font-size: 24rpx;
		color: #8a6a5a;
	}

	.progress-track {
		margin-top: 20rpx;
		height: 18rpx;
		border-radius: 999rpx;
		background: rgba(89, 74, 131, 0.12);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 999rpx;
		background: linear-gradient(90deg, #ffad88 0%, #5c4b85 100%);
		box-shadow: 0 12rpx 22rpx rgba(92, 75, 133, 0.2);
		transition: width 0.28s ease;
	}

	.stage-row {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14rpx;
		margin-top: 24rpx;
	}

	.stage-pill {
		padding: 18rpx 14rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.72);
		border: 2rpx solid rgba(94, 68, 54, 0.08);
	}

	.stage-pill.done {
		background: rgba(91, 75, 133, 0.12);
		border-color: rgba(91, 75, 133, 0.18);
	}

	.stage-pill.active {
		background: linear-gradient(
			135deg,
			rgba(255, 222, 203, 0.92) 0%,
			rgba(234, 228, 255, 0.92) 100%
		);
		border-color: rgba(91, 75, 133, 0.22);
		box-shadow: 0 14rpx 26rpx rgba(91, 75, 133, 0.1);
	}

	.stage-pill.upcoming {
		opacity: 0.76;
	}

	.stage-index {
		display: block;
		font-size: 22rpx;
		letter-spacing: 2rpx;
		color: #8d5d41;
	}

	.stage-label {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #3a2a25;
	}

	.summary-title,
	.result-type,
	.question-title {
		display: block;
		margin-top: 16rpx;
		font-size: 40rpx;
		line-height: 1.35;
		font-weight: 700;
		color: #2f211d;
	}

	.summary-copy,
	.result-copy,
	.question-caption,
	.summary-encourage,
	.feedback-copy {
		display: block;
		margin-top: 14rpx;
		font-size: 27rpx;
		line-height: 1.7;
		color: #6d5b56;
	}

	.summary-portrait {
		margin-top: 22rpx;
		padding: 24rpx 22rpx;
		border-radius: 26rpx;
		background: linear-gradient(
			135deg,
			rgba(255, 247, 239, 0.98) 0%,
			rgba(242, 239, 255, 0.98) 100%
		);
	}

	.summary-portrait-copy {
		display: block;
		margin-top: 10rpx;
		font-size: 28rpx;
		line-height: 1.8;
		color: #4e4057;
	}

	.summary-chip-row,
	.result-chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 14rpx;
		margin-top: 22rpx;
	}

	.summary-chip {
		padding: 14rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.92);
		border: 2rpx solid rgba(94, 68, 54, 0.08);
	}

	.summary-chip text {
		font-size: 23rpx;
		color: #594841;
	}

	.accent-chip {
		background: rgba(91, 75, 133, 0.08);
		border-color: rgba(91, 75, 133, 0.12);
	}

	.action-btn {
		min-height: 112rpx;
		padding: 0 24rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.action-btn text {
		font-size: 32rpx;
		font-weight: 600;
		line-height: 1;
	}

	.primary-btn {
		margin-top: 28rpx;
		background: linear-gradient(90deg, #2f2a47 0%, #594a83 100%);
		color: #fff9f0;
		box-shadow: 0 18rpx 32rpx rgba(77, 62, 109, 0.22);
	}

	.ghost-btn {
		background: rgba(255, 255, 255, 0.68);
		color: #4e3d37;
		border: 2rpx solid rgba(94, 68, 54, 0.12);
	}

	.option-list {
		margin-top: 26rpx;
	}

	.option-card {
		padding: 28rpx 24rpx;
		border-radius: 28rpx;
		background: rgba(255, 255, 255, 0.94);
		border: 2rpx solid rgba(94, 68, 54, 0.08);
		box-shadow: 0 16rpx 28rpx rgba(117, 88, 63, 0.08);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}

	.option-card + .option-card {
		margin-top: 18rpx;
	}

	.option-card.selected {
		transform: translateY(-4rpx);
		border-color: rgba(91, 75, 133, 0.28);
		box-shadow: 0 20rpx 34rpx rgba(91, 75, 133, 0.14);
		background: linear-gradient(
			135deg,
			rgba(255, 245, 237, 0.98) 0%,
			rgba(243, 239, 255, 0.98) 100%
		);
	}

	.option-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.option-dimension {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 56rpx;
		height: 56rpx;
		padding: 0 16rpx;
		border-radius: 999rpx;
		background: rgba(91, 75, 133, 0.12);
		font-size: 28rpx;
		font-weight: 700;
		color: #46385a;
	}

	.option-tip {
		font-size: 22rpx;
		color: #9b7f71;
	}

	.option-text {
		display: block;
		margin-top: 18rpx;
		font-size: 31rpx;
		line-height: 1.55;
		color: #342925;
	}

	.feedback-panel {
		margin-top: 24rpx;
		padding: 24rpx 22rpx;
		border-radius: 28rpx;
		background: rgba(255, 248, 241, 0.92);
		border: 2rpx solid rgba(255, 192, 152, 0.2);
	}

	.feedback-title {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #4a382f;
	}

	.question-card.locked {
		pointer-events: none;
	}

	.trait-list {
		margin-top: 26rpx;
	}

	.trait-item + .trait-item {
		margin-top: 22rpx;
	}

	.trait-track {
		position: relative;
		display: flex;
		margin-top: 12rpx;
		height: 20rpx;
		border-radius: 999rpx;
		overflow: hidden;
		background: rgba(89, 74, 131, 0.08);
	}

	.trait-half {
		flex: 1;
	}

	.trait-left {
		background: rgba(255, 178, 143, 0.34);
	}

	.trait-right {
		background: rgba(139, 200, 255, 0.28);
	}

	.trait-fill {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 999rpx;
		background: linear-gradient(90deg, #ffb28f 0%, #5b4b85 100%);
	}

	.fill-left {
		left: 0;
	}

	.fill-right {
		right: 0;
	}

	.trait-note {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #7f665b;
	}

	.result-actions {
		display: flex;
		gap: 16rpx;
		margin-top: 28rpx;
	}

	.result-actions .action-btn {
		flex: 1;
		margin-top: 0;
	}

	@media screen and (max-width: 420px) {
		.headline {
			font-size: 54rpx;
		}

		.stage-row {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.result-actions {
			flex-direction: column;
		}
	}
</style>
