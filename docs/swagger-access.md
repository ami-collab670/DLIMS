## **Staging Swagger Access Guide** 

## **Swagger UI** 

**URL:** `https://lsims-api-staging.onrender.com/api/docs/` 

## **Demo Client Credentials** 

- **Email:** `research@aau.example.com` 

- **Password:** `lsims123!` 

## **Login Steps** 

1. Open: `https://lsims-api-staging.onrender.com/api/docs/` 

2. Go to **POST /api/auth/token/** _→_ Click **Try it out** 

3. Enter request body: 

```
{
"email":"research@aau.example.com",
"password":"lsims123!"
}
```

4. Click **Execute** _→_ Copy the **access** token from response 

5. Click **Authorize** (top of page) 

6. Paste token: 

```
YOUR_ACCESS_TOKEN
```

7. Click **Authorize** _→_ **Close** 

## **View Data (After Authorization)** 

- **GET /api/laboratory/jobs/** 

- **GET /api/laboratory/samples/** 

- **Note:** These endpoints return only jobs and samples belonging to the current client account. 

- **Tip:** The access token enables all authenticated requests in Swagger. 

1 

