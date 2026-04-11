#!/bin/bash
export JAVA_HOME=/workspace/jdk8
export PATH=$JAVA_HOME/bin:$PATH
/workspace/elasticsearch-5.6.10/bin/elasticsearch -d
