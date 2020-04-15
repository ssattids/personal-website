import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import HomeIcon from '@material-ui/icons/Home';
import { Link } from 'react-router-dom'


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function NavBar() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'inherit' }}>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
                <HomeIcon />
            </IconButton>
          </Link>


          <Button color="inherit">
            <Link to="/experience" style={{ color: 'inherit', textDecoration: 'inherit' }}>
              Experience
            </Link>
          </Button>
          <Button color="inherit">
            <Link to="/projects" style={{ color: 'inherit', textDecoration: 'inherit' }}>
              Projects
            </Link>
          </Button>
          <Button color="inherit">
            <Link to="/education" style={{ color: 'inherit', textDecoration: 'inherit' }}>
              Education
            </Link>
          </Button>
          <Button color="inherit">
            <Link to="/blog" style={{ color: 'inherit', textDecoration: 'inherit' }}>
              Blog
            </Link>
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  );
}