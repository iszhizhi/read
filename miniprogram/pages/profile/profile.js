// pages/profile/profile.js
import formatTime from '../../utils/formatTime.js'
const db = wx.cloud.database()
let $url = ''
let openid = wx.getStorageSync('openid')
let currentMonth = new Date().getMonth() + 1
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCalendar: true, //当前界面是否为日历
    isRecord: false, //当前节面是否为记录
    record: [],
    likeBlog: [],
    likeRecommend: [],
    isLikeBlog: true,
    isLikeRecommend: false,
    myBlog: false,
    color: [
      '#F596AA',
      '#D75455',
      '#FC9F4D',
      '#FFB11B',
      '#90B44B',
      '#A5DEE4',
      '#51A8DD',
      '#7B90D2',
      '#F19483',
      '#E87A90',
      '#D75455',
      '#F0A986',
      '#E8B647',
      '#DDD23B',
      '#90B44B',
      '#A8D8B9',

    ]
  },
  /**
   * 连续打卡天数
   */
  getCardDate() {

  },
  /**
   * 切换是否喜欢博客或者推荐
   */
  isLikeBlog() {
    this.setData({
      likeBlog: [],
      isLikeBlog: true,
      isLikeRecommend: false,
      myBlog: false,
    })
    this.onLoadLikeBlog()
  },
  isLikeRecommend() {
    this.setData({
      isLikeBlog: false,
      isLikeRecommend: true,
      likeRecommend: []
    })
    this.onLoadRecommend()

    //获取喜欢的推荐
  },
  /**
   * 点击查看详情
   */
  detail(e) {
    let blogId = e.currentTarget.dataset.blogid
    let type = e.currentTarget.dataset.type //type的值为0或者1，为0说明是博客
    if (type == 0) {
      if (this.data.myBlog) {
        wx.navigateTo({
          url: `../blog-comment/blog-comment?blogId=${blogId}&&fix=${true}`,
        })
      } else {
        wx.navigateTo({
          url: `../blog-comment/blog-comment?blogId=${blogId}&&fix=${false}`,
        })
      }
    } else if (type == 1) {

    }
  },
  /**
   * 更新用户学校
   */
  updateSchool(e) {
    let school = e.detail.value
    console.log(school)
    db.collection('user').where({
      _openid: openid
    }).update({
      data: {
        updateTime: db.serverDate(),
        school,
      }
    }).then(res => {
      this.getUserSchool()
      wx.showModal({
        title: '修改成功',
        content: '',
        showCancel: false,
        confirmColor: "#86c166"
      })
    }).catch(err => {
      wx.showModal({
        title: '请检查您的网络再试',
        content: '',
        showCancel: false,
        confirmColor: "#86c166"
      })
    })
  },
  /**
   * 获取用户学校
   */
  getUserSchool(e) {
    wx.cloud.callFunction({
      name: 'user',
      data: {
        $url: 'school'
      }
    }).then(res => {
      if (res.result[0].school != '未填写') {
        this.setData({
          school: res.result[0].school,
          limitDays: res.result[0].limitDays
        })
      }
      console.log('success', res.result)
    })
  },
  chooseCalendar(e) {
    $url = 'getUserLike'
    this.setData({
      isRecord: false,
      isCalendar: true,
      likeBlog: [],
      isLikeBlog: true,
      myBlog: false,
    })
    this.onLoadLikeBlog()
    this.onLoadAllDays()
  },
  chooseRecord() {
    // wx.navigateTo({
    //   url: '../profile-bloghistory/profile-bloghistory',
    // })
    this.setData({
      likeRecommend: [],
      record: [],
      myBlog: true,
    })
    $url = 'getUserBlog'
    this.onLoadBlog()
  },
  /**
   * 获取上个月
   */
  prev(e) {
    currentMonth = e.detail.currentMonth
    console.log('prev', currentMonth)
    let flag = this.data.dayArr.hasOwnProperty(currentMonth) //用于判断对象中是否有该月份属性
    if (flag) {
      this.setData({
        dayStyle: this.data.dayArr[currentMonth]
      })
    } else {
      this.setData({
        dayStyle: []
      })
    }
  },
  /**
   *下个月
   */
  next(e) {
    currentMonth = e.detail.currentMonth
    let flag = this.data.dayArr.hasOwnProperty(currentMonth) //用于判断对象中是否有该月份属性
    if (flag) {
      this.setData({
        dayStyle: this.data.dayArr[currentMonth]
      })
    } else {
      this.setData({
        dayStyle: []
      })
    }
  },

  /**
   * 获取用户累计打卡天数
   */
  onLoadAllDays() {
    wx.cloud.callFunction({
      name: 'blog',
      data: {
        $url: 'allDays'
      }
    }).then(res => {
      console.log('渲染日历界面',res.result)
      let dayArr = {} //应该渲染的数据
      let cur = res.result.cardDay
      for (let j = 0; j < 12; j++) {
        var pre = [] //每次内层循环的临时数组
        for (let i = 0; i < cur.length; i++) {
          cur[i].createTime = formatTime(new Date(cur[i].createTime))
          if (parseInt(cur[i].createTime.substring(5, 7)) == j + 1) {

            let curTmp = cur[i]
            let tmp = []
            tmp.push(curTmp.createTime)
            var map = tmp.map(() => {
              let obj = {
                day: tmp[0].substring(8, 10),
                month: 'current',
                color: 'white',
                background: "#86c166",
              }
              pre.push(obj)
              return obj
            })
            var month = j + 1
          }
        }
        if (month) {
          dayArr[j + 1] = pre
        }
        pre = []
      }
      console.log(dayArr)
      this.data.dayArr = dayArr
      this.setData({
        dayStyle: dayArr[currentMonth]
      })

      this.setData({
        allDays: res.result.count.total,
        // dayStyle: res.result.cardDay
      })
    }).catch(err=>{
      console.log('渲染日历界面失败')

    })
  },
  /**
   *获取喜欢的博客
   */
  onLoadLikeBlog(start = 0) {
    wx.showLoading({
      title: '加载中',
    })

    wx.cloud.callFunction({
      name: 'blog',
      data: {
        $url,
        start,
        count: 5
      }
    }).then(res => {
      console.log(res)
      let blogList = res.result
      //格式化每个的时间
      for (let i = 0, len = blogList.length; i < len; i++) {
        blogList[i].createTime = formatTime(new Date(blogList[i].createTime))
        blogList[i].color = this.data.color[i % this.data.color.length]

        if (blogList[i].content.length > 35) {
          blogList[i].content = blogList[i].content.substring(0, 35) + '...'
        }
      }

      this.setData({
        likeBlog: res.result.concat(this.data.likeBlog),
        isLikeRecommend: false,
      })

      wx.hideLoading()

    })
  },
  /**
   * 用户自己的博客
   */
  onLoadBlog(start = 0) {
    wx.showLoading({
      title: '加载中',
    })

    this.setData({
      isRecord: true,
      isCalendar: false,

    })

    wx.cloud.callFunction({
      name: 'blog',
      data: {
        $url,
        start,
        count: 5
      }
    }).then(res => {
      let blogList = res.result
      //格式化每个的时间
      for (let i = 0, len = blogList.length; i < len; i++) {
        blogList[i].createTime = formatTime(new Date(blogList[i].createTime))
        blogList[i].color = this.data.color[i % this.data.color.length]
        if (blogList[i].content.length > 35) {
          blogList[i].content = blogList[i].content.substring(0, 35) + '...'
        }
      }
      this.setData({
        record: res.result.concat(this.data.record)
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
    })
  },
  //点击日历
  clickDay(e) {
    console.log(e)
  },
  /**
   * 获取用户喜欢的推荐
   */
  onLoadRecommend() {
    wx.cloud.callFunction({
      name: 'recommed',
      data: {
        $url: 'getPeopleLike',
        start: 0,
        count: 5,
      }
    }).then(res => {
      console.log('喜欢的推荐', res)
      this.setData({
        likeRecommend: res.result.concat(this.data.likeRecommend)
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.onLoadAllDays()
    this.getUserSchool()
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
    //每次加载时载入用户喜欢
    this.chooseCalendar()
    this.onLoadAllDays()
    this.getUserSchool()
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
    if (this.data.isRecord) {
      this.onLoadBlog(this.data.record.length)
    } else if (this.data.isCalendar) {
      this.onLoadLikeBlog(this.data.likeBlog.length)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})