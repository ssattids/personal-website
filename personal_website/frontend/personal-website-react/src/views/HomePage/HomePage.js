import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ProductHeroLayout from './ProductHeroLayout';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';


const backgroundImage =
  'https://www.jpl.nasa.gov/spaceimages/images/largesize/PIA23647_hires.jpg';

const profileImage = 
  "https://scontent-iad3-1.xx.fbcdn.net/v/t1.0-9/57204003_10218197652830778_2031492275145539584_n.jpg?_nc_cat=111&_nc_sid=85a577&_nc_ohc=bQN6WrkwJZgAX_RM_17&_nc_ht=scontent-iad3-1.xx&oh=8d8a593b8da30b4a2651eec1d574dcb4&oe=5EAE3885"

const useStyles = makeStyles(theme => ({
  background: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundColor: '#7fc7d9', // Average color of the background image.
    backgroundPosition: 'center',
  },
  button: {
    minWidth: 200,
  },
  h2: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4),
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing(10),
    },
  },
  h5: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4),
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing(10),
    },
  },
  more: {
    marginTop: theme.spacing(2),
  },
  large: {
    width: theme.spacing(30),
    height: theme.spacing(30),
  },
}));

export default function HomePage() {
  const classes = useStyles();

  return (
    <ProductHeroLayout backgroundClassName={classes.background}>
      {/* Increase the network loading priority of the background image. */}
      <Avatar alt="Remy Sharp" src={profileImage} className={classes.large} />
      <img style={{ display: 'none' }} src={backgroundImage} alt="increase priority" />
      <Typography color="inherit" align="center" variant="h2" marked="center" className={classes.h2}>
        Salar Satti
      </Typography>
      <Typography color="inherit" align="center" variant="h5" className={classes.h5}>
        Data Scientist
      </Typography>
      <Typography variant="body2" color="inherit" className={classes.more}>
        Trying to solve the world's problems using data
      </Typography>
    </ProductHeroLayout>
  );
}


