// components/recommend-card/recommend-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    recommendList: Object
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onDetail(e) {
      let id = e.currentTarget.dataset.id
      console.log('当前喜欢的id',id)
      wx.navigateTo({
        url: `/pages/recommend-detail/recommend-detail?id=${id}`,
      })
    }
  }
})