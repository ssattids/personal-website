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
            image="https://raw.githubusercontent.com/clankster99/NN_project/master/SemanticSegmentation.png"
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              Neural Networks and Vision
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Used Deep Convolution Neural Networks, specifically implemented Fully Connected Nets architecture for semantic segmentation, transfer learning, and used Google satellite imagery to determine traffic levels by detecting roads and cars
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Applications include finding faster routes through traffic and helping authorities manage traffic and plan infrastructure spending
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

      <Card className={classes.root}>
          <CardMedia
            className={classes.media}
            image="https://opennmt.net/simple-attn.png"
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              Neural Machine Translation
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Worked with Chief Product Scientist to implement various Machine Learning algorithms for X-ray scanners
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Implemented decision trees, linear regression, SVMs, and created random forest ensemble method which
improved accuracy
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Preprocessed data in various formats, intelligently handled missing values, and simulated data
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Conducted model evaluation, explained algorithms, created visualizations, and helped management
understand data issues
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

