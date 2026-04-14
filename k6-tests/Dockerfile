FROM grafana/k6:latest-with-browser

WORKDIR /tests

COPY tests /tests/

CMD [ "run", "/tests/k6-tests.js" ]