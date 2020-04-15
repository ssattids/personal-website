import React, { Fragment, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
  },
  media: {
    height: 140,
  },
});


export default function Experience() {
  const classes = useStyles();

  return (
    <div>
      {/* <Typography variant="h1" component="h2">
        Schneider Electric
      </Typography> */}
      <Card className={classes.root}>
          <CardMedia
            className={classes.media}
            image="https://media.baumpub.com/files/slides/locale_image/full/0157/39029_en_1f624_41610_schneider-electriclogo.jpg"
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              Blog 1
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Content of blog 1
            </Typography>
          </CardContent>
        <CardActions>
          <Button size="small" color="primary">
            Share
          </Button>
          <Button size="small" color="primary">
            Learn More
          </Button>
        </CardActions>
      </Card>

      
    
    </div>

  );
}

