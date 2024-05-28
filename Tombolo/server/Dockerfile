FROM ubuntu:bionic

RUN apt-get update -y && apt-get install -y build-essential curl
# intall node
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - ; apt-get install -y nodejs

ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

RUN echo "tzdata tzdata/Areas select America" > /tmp/preseed.txt; \
    echo "tzdata tzdata/Zones/America select New_York" >> /tmp/preseed.txt; \
    debconf-set-selections /tmp/preseed.txt
# intall packages used by ecl client tools
RUN apt-get install -y openssh-client openssh-server \
    expect rsync libapr1 psmisc libaprutil1 libarchive13 libatlas3-base \
    libboost-regex1.65.1 libmemcached11 libmemcachedutil2 libnuma1 \
    libpython2.7 libpython3.6 libxslt1.1 libcurl3-gnutls netcat git
    
RUN apt-get install -y python

ARG cdnUrl=https://cdn.hpccsystems.com
ARG hpccVersion=7.12.50
ARG clientToolsUrl=$cdnUrl/releases/CE-Candidate-$hpccVersion/bin/clienttools/hpccsystems-clienttools-community_$hpccVersion-1bionic_amd64.deb
# intall ecl client tools
RUN wget -O clienttools.deb $clientToolsUrl && dpkg -i clienttools.deb && rm clienttools.deb
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

RUN mkdir gitClones app
COPY . app

WORKDIR /app

RUN npm install -g node-gyp sequelize-cli pm2 && npm install
# Entry point is set on docker-compose, uncomment if docker-compose is not used
# ENTRYPOINT ["sh", "/app/docker-entry.sh", "mysql_db", "3306"]