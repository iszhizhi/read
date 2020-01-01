 // miniprogram/pages/playlist/playlist.js
 let MAX_LIMIT = 1
 let userInfo = ''
 const db = wx.cloud.database()
 Page({

   /**
    * 页面的初始数据
    */
   data: {
     like: false,
     recommend: [], //当前推荐的内容
     currentRecommend: 0, //当前推荐的页数
     isFirst: true, //判断当前页面是否为第一个
     isLast: false,
     modalShow: false, //是否显示评论
     loginShow: false,
     isExcute: true, //判断点赞是否执行完毕
   },
   share() {
     this.onShareAppMessage()
   },
   /**
    * 用户评论
    */
   onComment() {
     // 判断用户是否授权
     console.log('comment')
     wx.getSetting({
       success: (res) => {
         if (res.authSetting['scope.userInfo']) {
           console.log('sccess')
           wx.getUserInfo({
             success: (res) => {
               userInfo = res.userInfo
               // 显示评论弹出层
               this.setData({
                 modalShow: true,
               })
             }
           })
         } else {
           this.setData({
             loginShow: true,
           })
         }
       }
     })
   },

   onLoginsuccess(event) {
     userInfo = event.detail
     // 授权框消失，评论框显示
     this.setData({
       loginShow: false,
     }, () => {
       this.setData({
         modalShow: true,
       })
     })

   },
   onLoginfail() {
     wx.showModal({
       title: '授权用户才能进行评价',
       content: '',
     })
   },
   onSend(event) {
     console.log(event)
     // 插入数据库
     let content = event.detail.value.content
     if (content.trim() == '') {
       wx.showModal({
         title: '评论内容不能为空',
         content: '',
       })
       return
     }
     //  wx.showLoading({
     //    title: '评论中',
     //    mask: true,
     //  })
     wx.cloud.callFunction({
         name: 'check',
         data: {
           text: content
         }
       })
       .then(res => {
         if (res.result == null) {
           wx.showModal({
             title: '提示',
             content: '您的内容可能含有敏感词汇，请检查',
             showCancel: false,
             confirmColor: "#86c166"
           })
         } else if (res.result.errCode == 0) {
           db.collection('recommend-comment').add({
             data: {
               content,
               createTime: db.serverDate(),
               recommendId: this.data.recommend._id,
               nickName: userInfo.nickName,
               avatarUrl: userInfo.avatarUrl
             }
           }).then((res) => {
             wx.hideLoading()
             wx.showToast({
               title: '评论成功',
               showCancel: false,
               confirmColor: "#86c166"
             })
             this.setData({
               modalShow: false,
               content: '',
             })

           }).then(res=>{
             wx.hideLoading()
           })
         }
       })
     
   },
   /**
    * 用户点赞
    */
   like(e) {
     if (!this.data.isExcute) return
     this.data.isExcute = false
     wx.cloud.database().collection('recommendLikes')
       .where({
         recommendId: this.data.recommend._id,
         openid: wx.getStorageSync('openid')
       })
       .get()
       .then(res => {
         console.log('当前用户点赞情况', res.data)
         if (res.data.length == 0) {
           console.log('like')
           this.setData({
             'recommend.likes': this.data.recommend.likes + 1,
             like: true
           })
           wx.cloud.callFunction({
             name: 'recommed',
             data: {
               $url: 'peopleLike',
               recommendId: this.data.recommend._id,
             }
           }).then(res => {
             this.data.isExcute = true
           }).catch(err => {
             this.data.isExcute = true
             this.setData({
               like: false,
               'recommend.likes': this.data.recommend.likes - 1,
             })
           })
         } else {
           console.log('取消点赞')
           this.setData({
             'recommend.likes': this.data.recommend.likes - 1,
             like: false,
           })
           wx.cloud.callFunction({
             name: 'recommed',
             data: {
               $url: 'cancelPeopleLike',
               recommendId: this.data.recommend._id,
             }
           }).then(res => {
             this.data.isExcute = true
           }).catch(err => {
             this.setData({
               'recommend.likes': this.data.recommend.likes + 1,
               like: true,

             })
             this.data.isExcute = true

           })
         }
       }).catch(err => {
         this.data.isExcute = true

       })

   },
   /**
    * 获取推荐的总数量
    */
   total(e) {
     wx.cloud.callFunction({
       name: 'recommed',
       data: {
         $url: 'total'
       }
     }).then(res => {
       this.data.total = res.result.total
     })
   },
   _getrecommend(start = 0) {
     wx.cloud.callFunction({
       name: 'recommed',
       data: {
         $url: 'recommend',
         start,
         count: MAX_LIMIT
       }
     }).then(res => {

       let date = new Date(res.result[0].createTime.substring(0, 10).replace(/-/g, '/')); //Wed Jan 02 2019 00:00:00 GMT+0800 (China Standard Time)
       let chinaDate = date.toDateString(); //"Tue, 01 Jan 2019 16:00:00 GMT"
       //注意：此处时间为中国时区，如果是全球项目，需要转成【协调世界时】（UTC）
       let globalDate = date.toUTCString(); //"Wed Jan 02 2019"
       //之后的处理是一样的
       let chinaDateArray = chinaDate.split(' '); //["Wed", "Jan", "02", "2019"]
       res.result[0].createTime = `${chinaDateArray[1]} ${chinaDateArray[2]}, ${chinaDateArray[3]}`; //"Jan 02, 2019"


       this.setData({
         recommend: res.result[0]
       })


     }).catch(res => {})
   },

   preview() {

     if (this.data.currentRecommend == 0) {
       //如果当前就是第一个，那么点击无作用
       return
     }
     if (this.data.currentRecommend >= 1) {
       //判断是否不是第一个，不是的话当前界面数就减一
       this.data.currentRecommend = this.data.currentRecommend - 1
       this._getrecommend(this.data.currentRecommend)
       this.setData({
         isLast: false
       })
       //如果是推荐的第二个，那么减一过后当前应该是推荐的第一个
       if (this.data.currentRecommend == 0) {
         this.setData({
           isFirst: true,
           isLast: false
         })
       }
     }


   },
   next() {
     if (this.data.currentRecommend + 1 < this.data.total) {
       this.data.currentRecommend = this.data.currentRecommend + 1 //将当前推荐页数加一
       this.setData({
         isFirst: false
       })
       if (this.data.currentRecommend + 1 == this.data.total) {
         this.setData({
           isFirst: false,
           isLast: true
         })
       }
       this._getrecommend(this.data.currentRecommend)
     }


   },

   /**
    * 生命周期函数--监听页面加载
    */
   onLoad: function(options) {

     this._getrecommend()
     this.total()

   },

   /**
    * 生命周期函数--监听页面初次渲染完成
    */
   onReady: function() {

   },

   /**
    * 生命周期函数--监听页面显示
    */
   onShow: function() {

   },

   /**
    * 生命周期函数--监听页面隐藏
    */
   onHide: function() {

   },

   /**
    * 生命周期函数--监听页面卸载
    */
   onUnload: function() {

   },

   /**
    * 页面相关事件处理函数--监听用户下拉动作
    */
   onPullDownRefresh: function() {

   },

   /**
    * 页面上拉触底事件的处理函数
    */
   onReachBottom: function() {

   },

   /**
    * 用户点击右上角分享
    */
   onShareAppMessage: function() {

   }
 })