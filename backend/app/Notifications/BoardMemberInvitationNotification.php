<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BoardMemberInvitationNotification extends Notification
{
    public string $boardTitle;
    public string $invitedByName;
    public int $boardId;

    public function __construct(string $boardTitle, string $invitedByName, int $boardId)
    {
        $this->boardTitle = $boardTitle;
        $this->invitedByName = $invitedByName;
        $this->boardId = $boardId;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.url') . '/board/' . $this->boardId;

        return (new MailMessage)
            ->subject('Você foi adicionado a um quadro - Boardy')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line($this->invitedByName . ' adicionou você ao quadro "' . $this->boardTitle . '" no Boardy.')
            ->action('Acessar Quadro', $url)
            ->line('Clique no botão acima para acessar o quadro.')
            ->salutation('Atenciosamente, Equipe Boardy');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'board_id' => $this->boardId,
            'board_title' => $this->boardTitle,
            'invited_by' => $this->invitedByName,
        ];
    }
}
