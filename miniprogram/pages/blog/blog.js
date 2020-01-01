 // pages/blog/blog.js
 // 搜索的关键字
 let keywords = ''
 Page({

   /**
    * 页面的初始数据
    */
   data: {
     // 控制底部弹出层是否显示
     modalShow: false,
     blogList: [],
     isDetail: false, //判断当前界面是否为详情界面
     isNew: true, //初始化时默认为最新的界面
     isSearch: false,
     blogFlagNumber: 0, //用来判断用户是否签到过
   },
   /**
    * 查询今天是否已经打卡
    */
   isCard(e) {
     wx.cloud.callFunction({
         name: 'blog',
         data: {
           $url: 'theNewTime'
         }
       })
       .then(res => {
         console.log('isCard', res.data)
       })
   },
   showSearch(e) {
     this.setData({
       isSearch: !this.data.isSearch
     })
   },


   //最新
   theNew() {
     this.setData({
       isNew: true,
       blogList: []
     })
     this._onLoadBlogList(0)
   },
   //热门
   theHot() {
     this.setData({
       isNew: false,
       blogList: []
     })
     this._onLoadBlogList(0, 'getHotList')
   },

   /** 
    *用于获取博客列表的数据
    */
   _onLoadBlogList(start = 0, $url = "list") {
     wx.showLoading({
       title: '拼命加载中',
     })
     wx.cloud.callFunction({
       name: 'blog',
       data: {
         keywords, //用户模糊搜索的关键字
         start, //起始值为0
         count: 5, //一次最多十条内容
         $url,
       }
     }).then((res) => {
       keywords = ''
       console.log("blog", res.result)
       for (let index in res.result) {
         if (res.result[index].content.length > 45) {
           res.result[index].content = res.result[index].content.substring(0, 45) + '...'
         }
       }
       this.setData({
         blogList: this.data.blogList.concat(res.result),
         isSearch: false
       })

       wx.hideLoading()
       wx.stopPullDownRefresh()
     }).catch((res) => {
       this.setData({
         isSearch: false
       })
       wx.hideLoading()
       wx.showModal({
         title: '提示',
         content: '您的网络不好，请下拉刷新',
         showCancel: false,
         confirmColor: "#86c166"
       })
     })
   },

   /**
    * 用户点击搜索按钮搜索博客
    */
   search(e) {
     this.setData({
       blogList: []
     })
     keywords = e.detail.keyword
     this._onLoadBlogList()
     if(this.data.blogList.length==0){
       setTimeout(function(){
         wx.showModal({
           title: '呀，搜索暂时没结果，快去打卡吧',
           content: '',
           showCancel:false,
           confirmColor: "#86c166"
         })
       },800)
     }
   },

   /**
    * 生命周期函数--监听页面加载
    */
   onLoad: function(options) {
     console.log('blog')
    
     this._onLoadBlogList()


     // this.loadFontFace()

   },
   // loadFontFace() {
   //   wx.loadFontFace({
   //     family: 'songti',
   //     source: 'url     ("cloud://test-hx53i.7465-test-hx53i-1300755402/fonts/华文仿宋.ttf")',
   //     success(res) {
   //       console.log("font", res.status)
   //     },
   //     fail(res) {
   //       console.log("font", res.status)
   //     }
   //   });
   // },

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
    * 判断是否为同一天
    */
   oneDay() {
     let t = wx.getStorageSync('cardTime')
     return new Date(t).toDateString() === new Date().toDateString();
   },
   // 发布功能
   onPublish() {
     // 判断用户是否授权

     wx.getSetting({
       success: (res) => {
         if (res.authSetting['scope.userInfo']) {
           if (!this.oneDay()) {
             wx.getUserInfo({
               success: (res) => {
                 // console.log(res)
                 this.onLoginSuccess({
                   detail: res.userInfo
                 })
               }
             })
           } else {
             wx.showModal({
               title: '一天只能打卡一次哦',
               content: '',
               showCancel: false,
               confirmColor: "#86c166"
             })
           }

         } else {
           this.setData({
             modalShow: true,
           })
         }
       }
     })
   },
   goComment(e) {
     console.log(e)
     let blogId = e.target.dataset.blogid
     wx.navigateTo({
       url: `../blog-comment/blog-comment?blogId=${blogId}`,
     })
   },
   onLoginSuccess(event) {
     console.log(event)
     const detail = event.detail
     wx.navigateTo({
       url: `../blog-edit/blog-edit?nickName=${detail.nickName}&avatarUrl=${detail.avatarUrl}`,
     })
   },
   onLoginFail() {
     wx.showModal({
       title: '授权用户才能发布',
       content: '',
       showCancel: false,
       confirmColor: "#86c166"
     })
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
     this.setData({
       blogList: []
     })
     if (this.data.isNew) {
       this._onLoadBlogList(0)
     } else {
       this._onLoadBlogList(0, 'getHotList')
     }
   },

   /**
    * 页面上拉触底事件的处理函数
    */
   onReachBottom: function() {
     if (this.data.isNew) {
       this._onLoadBlogList(this.data.blogList.length)

     } else {
       this._onLoadBlogList(this.data.blogList.length, 'getHotList')
     }
   },

   /**
    * 用户点击右上角分享
    */
   onShareAppMessage: function(event) {
     console.log(event)
     let blogObj = event.target.dataset.blog
     return {
       title: blogObj.content,
       path: `/pages/blog-comment/blog-comment?blogId=${blogObj._id}`,
       // imageUrl: ''
     }
   }
 })