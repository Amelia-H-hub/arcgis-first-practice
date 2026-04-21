import axios from 'axios'

export const getCounties = () => {
  return axios.get('https://api.nlsc.gov.tw/other/ListCounty')
}
