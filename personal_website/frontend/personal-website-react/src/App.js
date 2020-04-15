import React, {Fragement} from 'react';
import ReactDOM from 'react-dom';
import Helmet from 'react-helmet';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import HomePage from './views/HomePage';
import NavBar from './components/NavBar';
import ExperienceView from './views/ExperienceView';
import ProjectView from './views/ProjectsView';
import EducationView from './views/EducationView';
import BlogView from './views/BlogView';

const App = () => {

  const theme = React.useMemo(() =>
      createMuiTheme({
        palette: {
          type: 'dark',
        },
      }),
  );

  return(
    <div>
      {/* <Helmet>
        <style>{'body { background-color: #000000; }'}</style>
      </Helmet> */}

      
      <ThemeProvider theme={theme}>
        <Router>
          <NavBar />
          <Switch>
            <Route exact path="/" component={HomePage}/>
            <Route exact path="/experience" component={ExperienceView}/>
            <Route exact path="/projects" component={ProjectView}/>
            <Route exact path="/education" component={EducationView}/>
            <Route exact path="/blog" component={BlogView}/>
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))