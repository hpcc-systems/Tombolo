import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Easy to Use",
    description: (
      <>
        Tombolo is designed to be easy to use, with a simple API and a
        comprehensive set of tutorials.
      </>
    ),
  },

  {
    title: "Powered by HPCC Systems",

    description: (
      <>
        Tombolo is built on top of HPCC Systems, a powerful open-source platform
        for big data analysis.
      </>
    ),
  },
  {
    title: "Focus on What Matters",
    description: (
      <>
        Tombolo lets you focus on your data and your analysis, without worrying
        about the underlying infrastructure.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
      <div className="text--center">
        {Svg && <Svg className={styles.featureSvg} role="img" />}
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
