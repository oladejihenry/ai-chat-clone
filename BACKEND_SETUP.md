# Laravel Backend Setup for T3Chat Authentication

## Required Routes

Based on your setup, add these routes to your `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// Google OAuth routes
Route::get('/auth/google/url', [GoogleController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

// Authentication routes in routes/web.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/api/user', fn(Request $request) => new UserResource($request->user()));
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
});
```

## Required Middleware Configuration

In your `app/Http/Kernel.php`, make sure you have:

```php
protected $middlewareGroups = [
    'web' => [
        // ... other middleware
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],

    'api' => [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## CORS Configuration

In your `config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3001')], // Updated port
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## Sanctum Configuration

In your `config/sanctum.php`, make sure:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3001,127.0.0.1,127.0.0.1:8000,::1', // Add your frontend port
    Sanctum::currentApplicationUrlWithPort()
))),
```

## Session Configuration

In your `config/session.php`, make sure:

```php
'same_site' => env('SESSION_SAME_SITE', 'lax'),
'secure' => env('SESSION_SECURE_COOKIE', false),
'domain' => env('SESSION_DOMAIN', null),
```

## Environment Variables

Add to your `.env`:

```env
FRONTEND_URL=http://localhost:3000
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

## GoogleController Updates

Update your `handleGoogleCallback` method to include avatar:

```php
public function handleGoogleCallback()
{
    try {
        $googleUser = Socialite::driver('google')
            ->user();

        //Check if user exists
        $user = User::where('email', $googleUser->email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'avatar' => $googleUser->avatar, // Add this line
                'email_verified_at' => now(),
                'password' => bcrypt(Str::random(24)),
            ]);

            event(new Registered($user));
        } else {
            $user->update([
                'avatar' => $googleUser->avatar, // Add this line
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);
        }

        // Login user
        Auth::login($user);

        return redirect()->intended(config('app.frontend_url') . '/');
    } catch (\Exception $e) {
        return redirect()->route('login')->with('error', 'Failed to login with Google');
    }
}
```

## User Model Updates

Add avatar field to your User model's `$fillable` array:

```php
protected $fillable = [
    'name',
    'email',
    'password',
    'avatar', // Add this line
    'email_verified_at',
];
```

## Database Migration

Create a migration to add avatar column:

```bash
php artisan make:migration add_avatar_to_users_table
```

```php
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('avatar')->nullable()->after('email');
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('avatar');
    });
}
```
