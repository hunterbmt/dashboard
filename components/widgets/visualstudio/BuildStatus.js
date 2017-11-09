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
  definationIds: yup.string().required(),
  interval: yup.number(),
  title: yup.string(),
  authKey: yup.string()
})

export default class BuildStatus extends Component {
  static defaultProps = {
    interval: 1000 * 60 * 5,
    title: 'CI/CD'
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
    const { authKey = 'vs', definationIds, url, project } = this.props
    const opts = authKey ? { headers: basicAuthHeader(authKey) } : {}

    try {
      const response = await fetch(`${url}/DefaultCollection/${project}/_apis/build/builds?definitions=${definationIds}&maxBuildsPerDefinition=1&api-version=2.0`, opts);
      const builds = await response.json();
      debugger;
      this.setState({ error: false, loading: false, builds: builds.value })
    } catch (error) {
      this.setState({ error: true, loading: false })
    } finally {
      this.timeout = setTimeout(() => this.fetchInformation(), this.props.interval)
    }
  }

  render () {
    const { loading, error, builds } = this.state
    const { title } = this.props

    return (
      <Widget title={title} error={error} loading={loading}>
        <Table>
          <tbody>
            {builds && _.map(builds, (build) => (
              <tr key={`vs-${build.definition.name}`}>
                <Th>{build.definition.name}</Th>
                <Td>
                  <a href={build.url} title={build.result}>
                    {
                      build.result
                      ? <BuildBadge status={build.result} />
                      : <LoadingIndicator size='small' />
                    }
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Widget>
    )
  }
}
