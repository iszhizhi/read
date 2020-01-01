// pages/recommend-detail/recommend-detail.js
import formatTime from '../../utils/formatTime.js'

let recommendId = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options)
    recommendId = options.id
    this.idToRecommend()
  },
  /**
   * 根据推荐id获取推荐内容
   */
  idToRecommend() {
    wx.cloud.callFunction({
      name: 'recommed',
      data: {
        $url: 'idToRecommend',
        recommendId: recommendId,
      }
    }).then(res => {
      console.log('detail',res)
      let commentList = res.result.commentList
      for (let i = 0, len = commentList.length; i < len; i++) {
        commentList[i].createTime = formatTime(new Date(commentList[i].createTime))
      }
      let date = new Date(res.result.detail[0].createTime.substring(0, 10).replace(/-/g, '/')); //Wed Jan 02 2019 00:00:00 GMT+0800 (China Standard Time)
      let chinaDate = date.toDateString(); //"Tue, 01 Jan 2019 16:00:00 GMT"
      //注意：此处时间为中国时区，如果是全球项目，需要转成【协调世界时】（UTC）
      let globalDate = date.toUTCString(); //"Wed Jan 02 2019"
      //之后的处理是一样的
      let chinaDateArray = chinaDate.split(' '); //["Wed", "Jan", "02", "2019"]
      res.result.detail[0].createTime = `${chinaDateArray[1]} ${chinaDateArray[2]}, ${chinaDateArray[3]}`; //"Jan 02, 2019"
    this.setData({
      recommend:res.result.detail[0],
      commentList:res.result.commentList
    })
    })
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