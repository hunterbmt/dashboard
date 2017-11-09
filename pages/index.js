import Dashboard from '../components/dashboard'

// Widgets
import DateTime from '../components/widgets/datetime'
import JiraIssueCount from '../components/widgets/jira/issue-count'
import JiraUpcomingRelease from '../components/widgets/jira/upcomingRelease'
import VisualStudioBuildStatus from '../components/widgets/visualstudio/BuildStatus'
import VisualStudioPullRequest from '../components/widgets/visualstudio/PullRequest'

// Theme
// import lightTheme from '../styles/light-theme'
import darkTheme from '../styles/dark-theme'

export default () => (
  <Dashboard theme={darkTheme}>
    <DateTime />
    <JiraUpcomingRelease projectId='IZ' url='https://izenda.atlassian.net'/>
    <JiraIssueCount title='Open Customer Blocking'
      url='https://izenda.atlassian.net'
      query='type=Bug AND project="IZ" AND priority="Customer Blocking" AND status not in (Closed, Done, Released)'
    />
    <VisualStudioBuildStatus
      url='https://gacode.visualstudio.com'
      project='Synergy'
      definationIds='136,127,128,137'
    />
    <VisualStudioPullRequest
      url='https://gacode.visualstudio.com'
      project='Synergy'
      repositoryIds='0ea0c267-d44c-4071-b44e-efa393c4141a'
      width='50em'
    />
  </Dashboard>
)
