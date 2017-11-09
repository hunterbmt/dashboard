import { Component } from 'react'
import fetch from 'isomorphic-unfetch'
import styled from 'styled-components'
import yup from 'yup'
import _ from 'lodash'
import Widget from '../../widget'
import Table, { Th, Td } from '../../table'
import Badge from '../../badge'
import LoadingIndicator from '../../loading-indicator'
import { basicAuthHeader } from '../../../lib/auth'

const BuildBadge = styled(Badge)`
  background-color: ${props => {
    switch (props.status) {
      case 'partiallySucceeded':
        return props.theme.palette.errorColor
      case 'succeeded':
        return props.theme.palette.successColor
      case 'canceled':
        return props.theme.palette.disabledColor
      default: // null = 'In Progress'
        return 'transparent'
    }
  }};
`

const schema = yup.object().shape({
  url: yup.string().url().required(),
  repositoryIds: yup.string().required(),
  interval: yup.number(),
  title: yup.string(),
  authKey: yup.string()
})

export default class BuildStatus extends Component {
  static defaultProps = {
    interval: 1000 * 60 * 5,
    title: 'Pull Request'
  }

  state = {
    loading: true,
    error: false
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

  async fetchInformation () {
    const { authKey = 'vs', repositoryIds, url, project } = this.props
    const opts = authKey ? { headers: basicAuthHeader(authKey) } : {}

    try {
      const response = await fetch(`${url}/DefaultCollection/${project}/_apis/git/repositories/${repositoryIds}/pullRequests`, opts);
      const pullRequests = await response.json();
      debugger;
      this.setState({ error: false, loading: false, pullRequests: _.take(pullRequests.value, 5) })
    } catch (error) {
      this.setState({ error: true, loading: false })
    } finally {
      this.timeout = setTimeout(() => this.fetchInformation(), this.props.interval)
    }
  }

  render () {
    const { loading, error, pullRequests } = this.state
    const { title, width } = this.props

    return (
      <Widget title={title} error={error} loading={loading} width={width}>
        <Table>
          <tbody>
            {
              pullRequests && _.map(pullRequests, (pr) => {
              const reviewers = _(pr.reviewers)
                .map((review) => _.last(review.displayName.split('\\')))
                .flatten()
                .join(', ');

              return (
                <tr key={`pr-${pr.pullRequestId}`}>
                  <Th>{pr.title}</Th>
                  <Td>{_.last(pr.targetRefName.split('/'))}</Td>
                  <Td>
                    {reviewers}
                  </Td>
                </tr>
              )
            })
          }
          </tbody>
        </Table>
      </Widget>
    )
  }
}
