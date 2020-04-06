import React, {Fragement} from 'react';
import ReactDOM from 'react-dom';
import NavBar from './components/NavBar';
import Helmet from 'react-helmet';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import HomePage from './views/HomePage';

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
      <Helmet>
        <style>{'body { background-color: #000000; }'}</style>
      </Helmet>

      <ThemeProvider theme={theme}>
        <NavBar />
        <HomePage />
      </ThemeProvider>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))