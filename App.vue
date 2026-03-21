<script>
  import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
  const uniIdCo = uniCloud.importObject('uni-id-co', {
	customUI: true
  })
  export default {
    onLaunch: async function() {
      console.log('App Launch')
		// #ifdef MP-WEIXIN
		uniCloud.initSecureNetworkByWeixin()
		// #endif
      this.syncPushClientId()
      checkUpdate() //更新升级
    },
    mounted() {
      // #ifdef H5
      //const VConsole = require('@/common/js/vconsole.min.js')
      //new VConsole()
      // #endif
    },
    onShow: function() {
      console.log('App Show')
    },
    onHide: function() {
      console.log('App Hide')
    },
    methods: {
      syncPushClientId() {
        if (!uni.getPushClientId || !uniIdCo || !uniCloud.getCurrentUserInfo) {
          return
        }
        const currentUserInfo = uniCloud.getCurrentUserInfo() || {}
        if (!currentUserInfo.uid) {
          return
        }
        uni.getPushClientId({
          success: async (res) => {
            const pushClientId = res && res.cid
            if (!pushClientId) {
              return
            }
            try {
              await uniIdCo.setPushCid({
                pushClientId
              })
            } catch (error) {
              console.error('syncPushClientId failed', error)
            }
          },
          fail: (error) => {
            console.error('getPushClientId failed', error)
          }
        })
      }
    }
  }
</script>

<style>
  /*每个页面公共css */
  /* #ifndef APP-NVUE */
  view {
    box-sizing: border-box;
  }

  @font-face {
    font-family: "iconfont";
    src: url('https://at.alicdn.com/t/font_2354462_s00xh8caffp.ttf');
  }

  .ico {
    font-family: iconfont;
  }

  /* #endif */
</style>
