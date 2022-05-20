FROM ubuntu:bionic

RUN mkdir -p /gitClones

WORKDIR app

COPY . app
# COPY [".env",  "/app/.env"]

RUN apt-get update -y && apt-get install -y build-essential curl

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -

RUN apt-get install -y nodejs

RUN apt-get update && apt-get install -y bash dos2unix

# RUN dos2unix /app/docker-entry.sh

ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

RUN echo "tzdata tzdata/Areas select America" > /tmp/preseed.txt; \
    echo "tzdata tzdata/Zones/America select New_York" >> /tmp/preseed.txt; \
    debconf-set-selections /tmp/preseed.txt

RUN apt-get install -y openssh-client openssh-server \
    expect rsync libapr1 psmisc libaprutil1 libarchive13 libatlas3-base \
    libboost-regex1.65.1 libmemcached11 libmemcachedutil2 libnuma1 \
    libpython2.7 libpython3.6 libxslt1.1 libcurl3-gnutls netcat git

ARG cdnUrl=https://cdn.hpccsystems.com
ARG hpccVersion=7.12.50

ARG clientToolsUrl=$cdnUrl/releases/CE-Candidate-$hpccVersion/bin/clienttools/hpccsystems-clienttools-community_$hpccVersion-1bionic_amd64.deb

RUN echo "get ${clientToolsUrl} with wget"
RUN wget -O clienttools.deb $clientToolsUrl && dpkg -i clienttools.deb && rm clienttools.deb

RUN echo "install ecl bundles"
RUN ecl bundle install https://github.com/hpcc-systems/ML_Core.git \
    && ecl bundle install https://github.com/hpcc-systems/PBblas.git \
    && ecl bundle install https://github.com/hpcc-systems/GLM.git \
    && ecl bundle install https://github.com/hpcc-systems/LearningTrees.git \
    && ecl bundle install https://github.com/hpcc-systems/LinearRegression.git \
    && ecl bundle install https://github.com/hpcc-systems/LogisticRegression.git \
    && ecl bundle install https://github.com/hpcc-systems/dbscan.git \
    && ecl bundle install https://github.com/hpcc-systems/SupportVectorMachines.git \
    && ecl bundle install https://github.com/hpcc-systems/DataPatterns.git \
    && ecl bundle install https://github.com/hpcc-systems/PerformanceTesting.git \
    && ecl bundle install https://github.com/hpcc-systems/Visualizer.git \
    && ecl bundle install https://github.com/OdinProAgrica/dapper.git

RUN npm install -g node-gyp && npm install

RUN npm install sequelize-cli pm2 -g


EXPOSE 3000

RUN npm install

CMD ["node", "server.js"]
