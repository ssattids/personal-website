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
              Schneider Electric
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Worked with terabyte scale data from cloud connected IoT devices, selected Spark and Parquet files to analyze data after running benchmarks
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Set-up data pipelines and managed several tables for our team and other teams using Spark and Azure
Data Bricks
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Worked on time series models for event prediction
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Created a dashboard using modern web technologies React and Django to give views into data
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              - Created NER (named entity recognition) model that classified customer reviews on our products based on
categories defined by business, out-performing previous approach
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
            image="https://mma.prnewswire.com/media/389973/Olympus_Logo.jpg?p=publish"
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              Olympus
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

