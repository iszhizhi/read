//app.js
let curTime = new Date().getTime()
let _openid = ''
App({
  onLaunch: function(options) {
    this.checkUpate()
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // 此处请填入环境 ID, 环境 ID 可打开云控制台查看
        env: 'production-ny6ui',
        traceUser: true,
      })
      if (!wx.getStorageSync('openid')) {
        this.getOpenid()
          .then(res => {
            this.isUser()
          })
      }

      this.limitDays()
      this.isLimitDay()
    }
  },

  onShow(options) {
    // console.log('onShow 执行')
    // console.log(options)
  },
  /**
   * 判断是否断签
   */
  isLimitDay() {
    let start = new Date(curTime).toDateString().slice(8, 10)
    let end = new Date(wx.getStorageSync('cardTime')).toDateString().slice(8, 10)
    let days = parseInt(start) - parseInt(end)
    console.log(start,days)
    return days
  },
  limitDays() {
    if (wx.getStorageSync('cardTime') != '') {
      if (this.isLimitDay() >= 2) {
        wx.cloud.callFunction({
          name: 'user',
          data: {
            type: 1,
            $url: 'limitDays'
          }
        }).then(res => {
          console.log('断更', res)
        })
      }
    }
  },
  /**
   * 判断用户是否存在，不存在就加入用户信息表
   */
  isUser(e) {
    wx.cloud.database().collection('user').where({
      _openid: _openid
    }).get().then(res => {
      console.log(res)
      if (res.data.length == 0) {
        //说明此时数据库没有该用户信息
        this.addUser()
      }
    })
  },
  getOpenid() {
    let promise = new Promise(resolve => {
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          _openid = res.result.openid
          wx.setStorageSync('openid', res.result.openid)
          resolve()
        }
      })
    })
    return promise
  },




  /**
   * 添加用户信息模板
   */
  addUser(e) {
    wx.cloud.callFunction({
      name: 'user',
      data: {
        $url: 'adduser'
      }
    }).then(res => {
      console.log('add')
    })
  },
  checkUpate() {
    const updateManager = wx.getUpdateManager()
    // 检测版本更新
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用',
            success(res) {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        })
      }
    })
  },
})