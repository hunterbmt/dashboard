import { Component } from 'react'
import fetch from 'isomorphic-unfetch'
import styled from 'styled-components'
import tinytime from 'tinytime'
import yup from 'yup'
import _ from 'lodash'
import Widget from '../../widget'
import Counter from '../../counter'
import { basicAuthHeader } from '../../../lib/auth'

const schema = yup.object().shape({
  url: yup.string().url().required(),
  projectId: yup.string().required(),
  authKey: yup.string(),
  interval: yup.number(),
  title: yup.string()
})

const Release = styled.div`
  font-size: 3em;
  text-align: center;
`

const Description = styled.div`
  margin-top: 0.5em;
  font-size: 2em;
  text-align: center;
`

export default class JiraUpcomingRelease extends Component {
  static defaultProps = {
    interval: 1000 * 60 * 60,
    title: 'Upcoming Release'
  }

  state = {
    days: 0,
    error: false,
    loading: true
  }

  componentDidMount () {
    schema.validate(this.props)
      .then(() => this.fetchInformation())
      .catch((err) => {
        console.error(`${err.name} @ ${this.constructor.name}`, err.errors)
        this.setState({ error: true, loading: false })
      })
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  calculateDays (date) {
    const currentDate = new Date()
    const endDate = new Date(date)
    const timeDiff = endDate.getTime() - currentDate.getTime()
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return diffDays
  }

  async fetchInformation () {
    const { authKey='jira', projectId, url } = this.props
    const opts = authKey ? {headers: basicAuthHeader(authKey)} : {}

    try {
      const res = await fetch(`${url}/rest/api/2/project/${projectId}/versions`, opts)
      const json = await res.json()
      const upcomingRelese = _(json)
        .filter((version) => !version.released && version.releaseDate)
        .orderBy('releaseDate')
        .first();
      const days = this.calculateDays(upcomingRelese.releaseDate)
      const releaseDate = new Date(upcomingRelese.releaseDate);
      //coverting JIRA US time to VN Time
      releaseDate.setDate(releaseDate.getDate() + 1);
      this.setState({
        upcomingRelese: upcomingRelese.name,
        releaseDate,
        days,
        error: false,
        loading: false
      })
    } catch (error) {
      this.setState({ error: true, loading: false })
    } finally {
      this.timeout = setTimeout(() => this.fetchInformation(), this.props.interval)
    }
  }

  render () {
    const { upcomingRelese = '',releaseDate, days, error, loading } = this.state
    const { title } = this.props
    return (
      <Widget title={title} loading={loading} error={error}>
        <Release>{upcomingRelese && `#${upcomingRelese}`}</Release>
        <Counter value={`${days} days`} />
        <Description>{releaseDate && tinytime('{DD}.{Mo}.{YYYY}').render(releaseDate)}</Description>
      </Widget>
    )
  }
}
