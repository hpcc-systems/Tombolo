---
sidebar_position: 4
---

# Uninstall Instructions

There are three potential steps that need to be completed in order to remove Tombolo from your system. It is easiest to follow the order given here.

1. Stop and remove any [Docker Containers](#docker).
2. Delete or drop the [MySQL Database](#mysql)
3. Remove your local [git repository](#git).

## Docker

If you have chosen to build and run Tombolo inside of a Docker, you will need to stop and remove your local containers. If you still have the local copy of your git repository installed, use the [Automated](#automated-using-git-repository) instructions. If you have removed them, you can still remove them using the [Manual](#manual) instructions below.

### Automated using Git Repository

Run the following commands from the root directory of your installation in your preferred terminal or integrated IDE

```bash
cd tombolo
```

```bash
docker-compose down -v
```

The `cd` command changes the directory you're working inside of.

The `docker-compose down -v` command stops, and removes any containers that were created utilizing the local docker-compose file. More information can be found in dockers [documentation](https://docs.docker.com/reference/cli/docker/compose/down/).

### Manual

If utilizing the Docker CLI, simply run the commands below from an integrated terminal or IDE.

```bash
docker ps
```

This command will list all of your running containers and their ID's. Find the ID's of the related containers your would like to remove and run the following command with each ID.

```bash
docker rm -f -v {container id}
```

More information can be found in the [docker documentations](https://docs.docker.com/reference/cli/docker/container/rm/).

If you are utilizing the Docker Desktop, or another GUI, please refer to the GUI or their associated documentation to stop and remove the containers.

## MySQL

If you still have your local copy of the Tombolo Git Repository in your system, we have provided a simple command to drop and remove the database.

Run the following commands from the root directory of your git repository in your preferred terminal or integrated IDE

```bash
cd tombolo/server
```

```bash
npm run dropSchema
```

The `cd` command changes the directory you're working with.

The `npm run dropSchema` command will run the associated command located in the package.json necessary to delete the database on your local system.

If you do not have your local copy of the Tombolo Git Repository, and do not wish to place it back on your system, you will need to drop your database manually. [This Link](https://www.mysqltutorial.org/mysql-basics/mysql-drop-database/) may be of assistance, walking you through options utilizing MySQL Workbench, or the MySQL CLI, depending on your system.

## Git

Simply delete the files and folders from your installation location.

If you wish to keep the files and folders, but remove the git repository, run the following command from the root directory of your repository.

```bash
rm -rf .git*
```

The `rm -rf .git*` command will remove any file or folder that begins with .git, including the .gitignore, .gitmodules, .git, etc.
