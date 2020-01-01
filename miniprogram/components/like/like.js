// components/like/like.js
let url = ''
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    likes: Number,
    blogId: String,
    url: String,
    isBlog: Boolean, //判断喜欢的是博客还是首页推荐
    isRecommend: Boolean, //判断用户喜欢的是首页推荐
    like: Boolean,

  },

  /**
   * 组件的初始数据
   */
  data: {
    isExcute: true,

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLike(e) {
      if (!this.data.isExcute) return
      this.data.isExcute = false
      wx.cloud.database()
        .collection('likes')
        .where({
          blogId: this.properties.blogId,
          openid: wx.getStorageSync('openid')
        })
        .get()
        .then(res => {
          if (res.data.length == 0) {
            this.setData({
              likes: this.properties.likes + 1,
              like: true
            })
            wx.cloud.callFunction({
              name: 'blog',
              data: {
                $url: 'peopleLikeBlog',
                blogId: this.properties.blogId
              }
            }).then(res => {
             this.data.isExcute=true

            }).catch(err => {
              this.setData({
                likes: this.properties.likes - 1,
                like: false,
                isExcute:true,
              })
              wx.showModal({
                title: '请检查您的网络再试',
                content: '',
                showCancel: false,
                confirmColor: "#86c166"
              })
            })
          } else {
            this.setData({
              likes: this.properties.likes - 1,
              like: false
            })
            wx.cloud.callFunction({
              name: 'blog',
              data: {
                $url: 'deletePeopleLikeBlog',
                blogId: this.properties.blogId
              }
            }).then(res => {
              this.setData({
                isExcute: true //状态码，执行成功
              })
            }).catch(err => {
              this.setData({
                likes: this.data.likes + 1,
                like: true,
                isExcute:true
              })
            })
          }
        })

    }
  }
})