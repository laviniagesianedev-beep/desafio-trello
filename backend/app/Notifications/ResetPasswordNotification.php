<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class ResetPasswordNotification extends Notification
{
    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appUrl = env('FRONTEND_URL', config('app.url'));
        $url = $appUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Recuperação de senha - Boardy')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Você solicitou a recuperação de senha da sua conta no Boardy.')
            ->action('Redefinir Senha', $url)
            ->line('Este link expira em 60 minutos.')
            ->line('Se você não solicitou esta recuperação, ignore este email.')
            ->salutation('Atenciosamente, Equipe Boardy');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'token' => $this->token,
        ];
    }
}
