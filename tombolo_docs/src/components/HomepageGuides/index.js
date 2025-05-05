import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";

const GuideList = [
  {
    title: "Docker Installation",
    description: (
      <>
        <p>
          Docker installation is the easiest way to get started with Tombolo.
          This is best for users who want to get started quickly with Tombolo
          without setting up dependencies on your local machine.
        </p>
        <div className="buttons_src-pages-index-module">
          <Link
            className="button button--secondary button--lg"
            to="/docs/Install/Docker"
          >
            Docker Installation ⏱️5 minutes
          </Link>
        </div>
      </>
    ),
  },
  {
    title: "Local Installation",
    description: (
      <>
        <p>
          Local installation requires a few dependencies to be installed
          directly on your machine. This is the best choice for developers who
          want to contribute to the project, or develop integrations.
        </p>

        <div className="buttons_src-pages-index-module">
          <Link
            className="button button--secondary button--lg"
            to="/docs/Install/Local"
          >
            Local Installation ⏱️15 minutes
          </Link>
        </div>
      </>
    ),
  },
];

function Guide({ Svg, title, description }) {
  return (
    <div
      className={clsx("col col--5 card")}
      style={{ paddingTop: ".5rem", marginBottom: "2rem" }}
    >
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

export default function HomepageGuides() {
  return (
    <>
      <h2
        style={{ marginTop: "2rem", marginBottom: "2rem", textAlign: "center" }}
      >
        Get Started by choosing your Installation Type
      </h2>
      <section className={styles.features}>
        <div className="container">
          <div className="row" style={{ justifyContent: "space-around" }}>
            {GuideList.map((props, idx) => (
              <Guide key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
