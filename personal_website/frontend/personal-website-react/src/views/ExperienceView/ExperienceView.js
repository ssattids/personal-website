import React, { Fragment, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Typography from '@material-ui/core/Typography';


const useStyles = makeStyles(theme => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
      width: 200,
      height: 200,
    }
  },
  extendedIcon: {
    marginRight: theme.spacing(1)
  },
  paper: {
    padding: theme.spacing(2)
  },
}));


export default function Experience() {

  return (
      <Typography variant="h1" component="h2">
        Coming soon..
      </Typography>
  );
}

