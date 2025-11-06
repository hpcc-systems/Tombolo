FROM node:24-trixie

RUN apt-get update -y && apt-get install -y build-essential curl

RUN corepack enable && \
    corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

RUN echo "tzdata tzdata/Areas select America" > /tmp/preseed.txt; \
    echo "tzdata tzdata/Zones/America select New_York" >> /tmp/preseed.txt; \
    debconf-set-selections /tmp/preseed.txt
# Install python
RUN apt-get install -y python

# install packages used by ecl client tools
RUN apt-get install -y openssh-client openssh-server \
    expect rsync libapr1 psmisc libaprutil1 libarchive13 libatlas3-base \
    libboost-regex1.65.1 libmemcached11 libmemcachedutil2 libnuma1 \
    libpython2.7 libpython3.6 libxslt1.1 libcurl3-gnutls netcat git


RUN mkdir gitClones app
COPY . app

WORKDIR /app

RUN pnpm add -g node-gyp sequelize-cli pm2 && pnpm install
# Entry point is set on docker-compose, uncomment if docker-compose is not used
# ENTRYPOINT ["sh", "/app/docker-entry.sh", "mysql_db", "3306"]