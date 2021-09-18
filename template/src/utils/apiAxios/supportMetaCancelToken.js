//手动实现cancel request
//let cancel = null
//axios.get('url', {
//  params: {},
//  cancelToken: new axios.CancelToken((cancelExecutor) => {
//    cancel = cancelExecutor
//  })
//})
//cancel('custom error message')

/*
 * 本模块是对cancel request的封装，直接在meta: {cancelToken}里赋值，来得到url+cancelToken作为唯一key值，请求前会取消之前的请求
 * eg: axios.get('url', { meta: { cancelToken: 'extTable' } })
 * eg: axios.post('url', {}, { meta: { cancelToken: 'extTable' } })
 */
export default function (axios) {
  const ExecutorMap = {}
  const createCancelToken = (config) => {
    const cancelToken = config.meta?.cancelToken
    if (cancelToken) {
      const key = `${config.url}-${cancelToken}`
      config.cancelToken = new axios.CancelToken((cancelExecutor) => {
        if (ExecutorMap[key]) {
          ExecutorMap[key]('customCancel') // 取消掉之前的请求
        }
        ExecutorMap[key] = cancelExecutor
      })
    }
  }
  const clearCancelToken = (config) => {
    const cancelToken = config.meta?.cancelToken
    if (cancelToken) {
      const key = `${ config.url }-${ cancelToken }`
      ExecutorMap[key] = null
    }
  }
  
  // 请求拦截
  axios.interceptors.request.use(config => {
    createCancelToken(config)
    return config
  }, error => {
    return Promise.reject(error)
  })
  
  // 响应拦截
  axios.interceptors.response.use(resp => {
    // 请求成功
    clearCancelToken(resp.config)
    return Promise.resolve(resp)
  }, error => {
    // 请求失败
    if (error.config) {
      clearCancelToken(error.config)
    }
    return Promise.reject(error)
  })
}