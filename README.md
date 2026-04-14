How to start k6 tests:
docker compose run --rm --entrypoint=k6 k6-tests run /tests/k6-tests.js

How to start container:
docker compose up --build

How to access database:
docker exec -it postgresql_database psql -U username database